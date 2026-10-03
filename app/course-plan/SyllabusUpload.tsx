"use client";

import { useRef, useState, type Dispatch, type SetStateAction } from "react";
import type { Course, Day } from "./_lib/types";

export type Draft = { id: string; source: string; name: string; credits: number | null; professor: string; category: string; syllabus: string; schedule: Course["schedule"] };
const days: Day[] = ["월", "화", "수", "목", "금"];
const clock = (value: number) => value < 0 ? "" : `${Math.floor(value / 60).toString().padStart(2,"0")}:${(value % 60).toString().padStart(2,"0")}`;
const minutes = (value: string) => value ? Number(value.split(":")[0]) * 60 + Number(value.split(":")[1]) : -1;

export default function SyllabusUpload({ courses, onChange, onBusy, drafts, setDrafts }: { drafts: Draft[]; setDrafts: Dispatch<SetStateAction<Draft[]>>; courses: Course[]; onChange: (courses: Course[]) => void; onBusy: (busy: boolean) => void }) {
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<string[]>([]);
  const lock = useRef(false);
  async function upload(files: File[]) {
    if (lock.current || !files.length) return;
    if (files.length > 10) { setMessages(["한 번에 PDF 10개까지 선택할 수 있어요."]); return; }
    lock.current = true; setBusy(true); onBusy(true); setMessages([]);
    const errors: string[] = [];
    const extracted: Draft[] = [];
    for (const file of files) {
      if (!file.name.toLowerCase().endsWith(".pdf") || file.size > 3 * 1024 * 1024) { errors.push(`${file.name}: 3MB 이하 PDF만 지원합니다.`); continue; }
      try {
        const form = new FormData(); form.append("file", file);
        const response = await fetch("/course-plan/api/syllabi", { method: "POST", body: form, signal: AbortSignal.timeout(60_000) });
        const data = await response.json();
        if (!response.ok) throw new Error(data.detail || "분석 실패");
        if (!Array.isArray(data.courses) || !data.courses.length) throw new Error("수업계획서에서 과목을 찾지 못했습니다.");
        extracted.push(...data.courses.map((c: Omit<Draft,"id"|"source">)=>({...c, id: `upload-${crypto.randomUUID()}`, source: file.name})));
      } catch (e) { errors.push(`${file.name}: ${e instanceof Error ? e.message : "분석 실패"}`); }
    }
    setDrafts(prev=>[...prev,...extracted]); setMessages(errors);
    lock.current=false; setBusy(false); onBusy(false);
  }
  function patch(id: string, change: Partial<Draft>) { setDrafts(prev=>prev.map(d=>d.id===id?{...d,...change}:d)); }
  function confirm(d: Draft) {
    if (!d.name.trim() || !d.credits || !Number.isInteger(d.credits) || d.credits<1 || d.credits>6 || !d.schedule.length || d.schedule.some(m=>m.start<480 || m.start>1200 || m.end>1260 || m.end<=m.start)) { setMessages(["과목명, 1~6학점, 수업 시간(08:00~21:00)을 확인해 주세요."]); return; }
    if (courses.length>=10) { setMessages(["필수 과목은 최대 10개까지 추가할 수 있어요."]); return; }
    if (courses.some(c=>c.name.trim()===d.name.trim())) { setMessages(["같은 이름의 과목이 이미 추가되어 있어요."]); return; }
    onChange([...courses, { course_id: d.id, name: d.name.trim(), credits: d.credits, professor: d.professor || "미기재", category: d.category, syllabus: d.syllabus, schedule: d.schedule, prerequisites: [], career_tags: [], recommended_year: 2,
      assessment: {exam:25,assignment:25,project:25,participation:25},
      learning_style: {memorization:50,problem_solving:50,essay:50,team_project:50,presentation:50,project:50,exam:50,practice:50}, campus_life: {social:50,discussion:50,exploration:50,quiet:50},
    }]);
    setDrafts(prev=>prev.filter(x=>x.id!==d.id)); setMessages([]);
  }
  return <section className="syllabus-upload"><h3>이번 학기 꼭 듣고 싶은 과목</h3><p>수업계획서 PDF를 여러 개 올리고, 추출된 내용을 확인한 뒤 필수 과목으로 추가하세요. 파일당 3MB, 한 번에 10개까지 지원합니다.</p><p>PDF는 Gemini로 분석합니다. 누락된 학점·시간은 직접 입력해 주세요. 확인 전 과목은 추천에 반영되지 않습니다.</p>
    <label className="full-field">수업계획서 PDF 업로드<input type="file" accept=".pdf,application/pdf" multiple disabled={busy} onChange={e=>{const files=Array.from(e.target.files??[]);e.target.value="";void upload(files);}}/></label>
    {busy&&<p role="status">수업계획서를 차례로 분석하고 있어요…</p>}
    {messages.map((m,i)=><p role="alert" className="error-box" key={i}>{m}</p>)}
    {drafts.map(d=><article className="syllabus-draft" key={d.id}><p>{d.source} · 확인 필요</p><div className="field-grid">
      <label>과목명<input value={d.name} maxLength={200} onChange={e=>patch(d.id,{name:e.target.value})}/></label>
      <label>학점<input type="number" min={1} max={6} value={d.credits??""} onChange={e=>patch(d.id,{credits:e.target.value===""?null:Number(e.target.value)})}/></label>
      <label>교수<input value={d.professor} onChange={e=>patch(d.id,{professor:e.target.value})}/></label>
      <label>과목 구분<select value={d.category} onChange={e=>patch(d.id,{category:e.target.value})}>{["전공기초","전공선택","교양"].map(c=><option key={c}>{c}</option>)}</select></label></div>
      {d.schedule.map((m,i)=><div className="meeting-row" key={i}><label>요일<select value={m.day} onChange={e=>patch(d.id,{schedule:d.schedule.map((v,j)=>j===i?{...v,day:e.target.value as Day}:v)})}>{days.map(day=><option key={day}>{day}</option>)}</select></label><label>시작<input type="time" value={clock(m.start)} onChange={e=>patch(d.id,{schedule:d.schedule.map((v,j)=>j===i?{...v,start:minutes(e.target.value)}:v)})}/></label><label>종료<input type="time" value={clock(m.end)} onChange={e=>patch(d.id,{schedule:d.schedule.map((v,j)=>j===i?{...v,end:minutes(e.target.value)}:v)})}/></label><button type="button" className="text-button" onClick={()=>patch(d.id,{schedule:d.schedule.filter((_,j)=>j!==i)})}>시간 삭제</button></div>)}
      <div className="syllabus-actions"><button type="button" className="secondary" onClick={()=>patch(d.id,{schedule:[...d.schedule,{day:"월",start:-1,end:-1}]})}>수업 시간 추가</button><button type="button" className="primary" onClick={()=>confirm(d)}>꼭 듣고 싶은 과목</button><button type="button" className="text-button" onClick={()=>setDrafts(prev=>prev.filter(x=>x.id!==d.id))}>추출 취소</button></div>
    </article>)}
    {courses.map(c=><div className="syllabus-confirmed" key={c.course_id}><span>{c.name} · {c.credits}학점 · {c.schedule.map(m=>`${m.day} ${clock(m.start)}–${clock(m.end)}`).join(", ")}</span><button type="button" className="text-button" onClick={()=>onChange(courses.filter(x=>x.course_id!==c.course_id))}>과목 삭제</button></div>)}
    <p>업로드 과목은 우선 배치합니다. 시간 충돌·공강·최대학점으로 배치할 수 없으면 결과에 표시합니다.</p>
  </section>;
}
