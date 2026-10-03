"use client";

import { useEffect, useState } from "react";
import { ArrowRight, ArrowLeft, ArrowUpRight, Check, ChevronDown, Compass, GraduationCap, Layers, Leaf, LoaderCircle, RotateCcw, ShieldCheck, Sparkles, X } from "lucide-react";
import { baseProfile, persona } from "@/lib/profile";
import type { CampusKey, Course, Day, LearningKey, Profile, Result } from "@/lib/types";

const steps = ["기본 정보", "나의 진로", "학습 성향", "시간표 선호", "대학생활 계획", "Campus Life"];
const careers = ["Embedded Software", "Backend", "Frontend", "AI/ML", "Data", "Game", "System Software", "Graduate School", "아직 모름", "직접 입력"];
const days: Day[] = ["월", "화", "수", "목", "금"];
const learningLabels: [LearningKey, string, string][] = [
  ["memorization", "암기", "개념과 내용을 기억하는 공부"], ["problem_solving", "문제 해결", "생각하고 답을 찾아가는 공부"],
  ["practice", "실습", "직접 만들고 실행하며 배우기"], ["project", "프로젝트", "하나의 결과물을 완성하는 수업"],
  ["team_project", "팀 프로젝트", "함께 역할을 나누어 진행하기"], ["presentation", "발표", "사람들 앞에서 생각 전달하기"],
  ["essay", "서술형 평가", "글로 논리와 생각을 설명하기"], ["exam", "시험 중심 평가", "과제보다 시험 비중이 높은 수업"],
];
const campusLabels: [CampusKey, string, string][] = [["social", "새로운 사람 만나기", "다양한 학생과 교류하고 싶어요"], ["discussion", "토론과 참여", "의견을 나누며 배우고 싶어요"], ["exploration", "새로운 분야 경험", "전공 밖의 세계도 탐색하고 싶어요"], ["quiet", "조용한 개인 학습", "혼자 집중하는 시간이 좋아요"]];
const partLabels = { career: "진로", learning: "학습", assessment: "평가", schedule: "시간표", campus: "대학생활", academic: "학업계획" };
function time(minutes: number) { return `${Math.floor(minutes / 60).toString().padStart(2, "0")}:${(minutes % 60).toString().padStart(2, "0")}`; }
function schedule(course: Course) { return course.schedule.map(m => `${m.day} ${time(m.start)}–${time(m.end)}`).join(" · "); }
function Range({ label, description, value, onChange }: { label: string; description: string; value: number; onChange: (v: number) => void }) {
  return <label className="range-field"><span className="range-head"><span><strong>{label}</strong><small>{description}</small></span><b>{value}<span>/100</span></b></span><input type="range" min="0" max="100" value={value} onChange={e => onChange(Number(e.target.value))} aria-label={label} /><span className="range-ends"><span>선호하지 않음</span><span>매우 선호함</span></span></label>;
}
function Chips({ label, selected, onChange }: { label: string; selected: Day[]; onChange: (v: Day[]) => void }) {
  return <div className="day-field"><h3>{label}</h3><div className="day-chips">{days.map(day => <button type="button" className={selected.includes(day) ? "day active" : "day"} key={day} aria-pressed={selected.includes(day)} onClick={() => onChange(selected.includes(day) ? selected.filter(x => x !== day) : [...selected, day])}>{day}<small>요일</small></button>)}</div></div>;
}

export default function Home() {
  const [view, setView] = useState<"landing" | "profile" | "result">("landing");
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState<Profile>(structuredClone(baseProfile));
  const [courses, setCourses] = useState<Course[]>([]);
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [catalogState, setCatalogState] = useState<"loading" | "ready" | "error">("loading");
  const [catalogRetry, setCatalogRetry] = useState(0);
  const [customCareer, setCustomCareer] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/courses", { signal: AbortSignal.timeout(60_000) }).then(async r => {
      if (!r.ok) throw new Error("catalog");
      const data = await r.json();
      if (!cancelled) { setCourses(data.courses); setCatalogState("ready"); }
    }).catch(() => { if (!cancelled) setCatalogState("error"); });
    return () => { cancelled = true; };
  }, [catalogRetry]);

  function update<K extends keyof Profile>(key: K, value: Profile[K]) { setProfile(p => ({ ...p, [key]: value })); }
  function start(kind?: "A" | "B") {
    if (kind) { setProfile(persona(kind)); setCustomCareer(false); }
    setView("profile"); setStep(0); setError(""); setNotice("");
  }
  async function requestRecommendations(failedCourse?: string, successfulOverride?: string[]) {
    if (busy) return;
    setBusy(true); setError(""); setNotice("");
    const recovery = Boolean(failedCourse || successfulOverride);
    const body = { profile, successful_ids: successfulOverride ?? (recovery ? result?.successful_ids ?? [] : []), failed_ids: recovery ? result?.failed_ids ?? [] : [], current_ids: recovery ? result?.recommendations.map(r => r.course.course_id) ?? [] : [], ...(failedCourse ? { failed_course_id: failedCourse } : {}) };
    try {
      const response = await fetch(failedCourse ? "/api/recommend/alternative" : "/api/recommend", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal: AbortSignal.timeout(60_000) });
      const data = await response.json();
      if (!response.ok) throw new Error(typeof data.detail === "string" ? data.detail : "입력값을 확인해 주세요. 학점과 학년 등 허용 범위를 벗어났습니다.");
      setResult(data); setView("result");
      if (failedCourse) setNotice("실패한 과목을 제외하고 시간표를 다시 구성했습니다. 수강 성공 과목은 유지됩니다.");
      else if (successfulOverride) setNotice("수강 상태를 반영했습니다.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) { setError(e instanceof Error ? e.message : "추천 요청에 실패했습니다."); }
    finally { setBusy(false); }
  }
  function toggleCourse(key: "completed_ids" | "required_ids", id: string) {
    setProfile(p => ({ ...p, [key]: p[key].includes(id) ? p[key].filter(x => x !== id) : [...p[key], id], ...(key === "completed_ids" ? { required_ids: p.required_ids.filter(x => x !== id) } : {}) }));
  }

  return <div className="site">
    <header className="site-header"><button className="brand" onClick={() => { setView("landing"); setError(""); }} aria-label="딸깍 홈"><span className="brand-icon"><Layers size={21} /></span>딸깍<span className="brand-dot">.</span></button><span className="header-caption">YOUR NEXT SEMESTER, REIMAGINED</span><span className="demo-badge"><span />AI BUILD DEMO</span></header>
    <main>
      {view === "landing" && <>
        <section className="hero"><div className="hero-copy"><span className="eyebrow"><Sparkles size={14} /> 나만의 수강전략 메이커</span><h1>좋은 강의 말고,<br /><span>나에게 좋은 강의.</span></h1><p className="hero-description">너의 진로, 공부 스타일, 그리고 대학생활까지.<br />이번 학기는 남들의 추천 대신<br className="mobile-break" /> 나만의 기준으로 골라봐.</p><button className="primary hero-cta" onClick={() => start()}>내 수강전략 만들기 <ArrowUpRight size={20} /></button><p className="cta-note">로그인 없이 시작 · 약 3분이면 충분해요</p><div className="hero-proof"><span><ShieldCheck size={16} /> 시간 충돌 자동 확인</span><span><RotateCcw size={16} /> 수강 실패에도 Plan B</span></div></div>
          <div className="hero-art" aria-label="개인화 수강전략 예시"><div className="art-orbit orbit-one" /><div className="art-orbit orbit-two" /><span className="floating-tag tag-top"><Compass size={17} /> Embedded Software</span><span className="floating-tag tag-bottom"><Leaf size={17} /> 금요일은 나를 위한 시간</span><div className="strategy-preview"><div className="preview-top"><span><Sparkles size={15} /> MY SEMESTER</span><span className="preview-dots">•••</span></div><div className="preview-heading"><span className="preview-icon"><GraduationCap size={30} /></span><div><small>나의 수강전략</small><h2>이런 학기, 어때요?</h2></div></div><div className="preview-course"><div><span className="tiny-label">전공선택</span><h3>시스템프로그래밍</h3><p>실습과 문제 해결이 좋은 너에게</p></div><div className="preview-score">94<small>FIT SCORE</small></div></div><div className="preview-bars">{[76,94,87].map((n,i)=><div key={n}><span>{["진로 적합도","학습성향","시간표"][i]}</span><div><i style={{width:`${n}%`}} /></div><b>{n}</b></div>)}</div><div className="preview-plan"><span>PLAN B</span><div><strong>C++ Programming</strong><small>다음 선택도 준비되어 있어요</small></div><ArrowRight size={18} /></div><div className="preview-footer"><Check size={14} /> 시간 충돌 없이, 나에게 맞게.</div></div><span className="art-label">예시 화면 · 가상 적합도</span></div>
        </section>
        <section className="features"><div><span className="feature-number">01 / FIND YOUR FIT</span><h3>공부 스타일도 취향이니까</h3><p>암기보다 실습, 팀플보다 개인과제.<br />내가 편한 방식으로 배워요.</p></div><div><span className="feature-number">02 / MAKE IT POSSIBLE</span><h3>원하는 일상까지 담아서</h3><p>진로에 가까워지는 수업과<br />지키고 싶은 공강을 함께 고려해요.</p></div><div><span className="feature-number">03 / ALWAYS HAVE A PLAN B</span><h3>수강 실패가 끝은 아니니까</h3><p>한 과목을 놓쳐도 괜찮아요.<br />조건에 맞는 다음 선택을 찾아줘요.</p></div></section>
        <section className="demo-strip"><div><span className="eyebrow">QUICK PREVIEW</span><h3>어떤 추천이 나오는지 궁금하다면?</h3><p>두 가지 예시 프로필로 빠르게 시작해 보세요.</p></div><div className="demo-actions"><button className="secondary" onClick={() => start("A")}>A. 임베디드 개발자 <ArrowRight size={16} /></button><button className="secondary" onClick={() => start("B")}>B. 진로 탐색 새내기 <ArrowRight size={16} /></button></div></section>
      </>}

      {view === "profile" && <section className="workspace"><aside className="step-sidebar"><span className="eyebrow">BUILD YOUR SEMESTER</span><h1>너를 알아가는<br />여섯 가지 질문.</h1><p>정답은 없어요.<br />지금의 나를 알려주세요.</p><nav aria-label="프로필 단계">{steps.map((label,i)=><button key={label} className={`step-link ${step===i?"current":""} ${step>i?"done":""}`} onClick={()=>setStep(i)} aria-current={step===i?"step":undefined}><span>{step>i?<Check size={14}/>:String(i+1).padStart(2,"0")}</span>{label}</button>)}</nav><div className="sidebar-note"><ShieldCheck size={19}/><p>추천은 입력한 선호로 계산해요.<br />MBTI·성별로 능력을 추정하지 않아요.</p></div></aside>
        <div className="form-panel"><div className="form-top"><span>PROFILE / {String(step+1).padStart(2,"0")}</span><span>{step+1} of 6</span></div><div className="progress-track"><i style={{width:`${(step+1)/6*100}%`}}/></div><form onSubmit={e=>{e.preventDefault();if(step<5)setStep(step+1);else void requestRecommendations();}}>
          <div className="form-heading"><h2>{["반가워요! 기본부터 시작해요.","어떤 미래를 그리고 있나요?","어떤 공부가 나에게 맞나요?","이번 학기, 언제 만나볼까요?","앞으로의 계획을 알려주세요.","수업 밖의 나도 중요하니까."][step]}</h2><p>{["학업 단계와 이미 배운 과목을 알려주세요.","진로가 정해지지 않았어도 괜찮아요.","선호도를 높일수록 그 방식에 가까운 과목을 찾아요.","공강일은 반드시 지키고, 나머지 선호는 적합도에 반영해요.","병역 계획은 기초 과목의 학업계획 적합도에 반영해요.","대학생활에서 중요하게 생각하는 경험을 골라주세요."][step]}</p></div>
          {step===0 && <><div className="field-grid"><label>학교<input value={profile.school} maxLength={100} onChange={e=>update("school",e.target.value)}/></label><label>학과 / 전공<input value={profile.major} maxLength={100} onChange={e=>update("major",e.target.value)}/></label><label>학년<select value={profile.year} onChange={e=>update("year",Number(e.target.value))}>{[1,2,3,4,5,6].map(n=><option key={n} value={n}>{n}학년</option>)}</select></label><label>학기<select value={profile.semester} onChange={e=>update("semester",Number(e.target.value))}><option value={1}>1학기</option><option value={2}>2학기</option></select></label><label>이수학점<input type="number" min={0} max={300} required value={profile.earned_credits} onChange={e=>update("earned_credits",Number(e.target.value))}/></label><label>GPA / 4.5<input type="number" min={0} max={4.5} step={0.01} required value={profile.gpa} onChange={e=>update("gpa",Number(e.target.value))}/></label></div><div className="course-picker"><h3>이미 이수한 과목 <span>{profile.completed_ids.length}개</span></h3><p>선수과목 확인과 중복 추천 방지에 사용해요.</p>{catalogState==="ready"?<div className="course-chips">{courses.map(c=><button type="button" key={c.course_id} aria-pressed={profile.completed_ids.includes(c.course_id)} className={profile.completed_ids.includes(c.course_id)?"chip selected":"chip"} onClick={()=>toggleCourse("completed_ids",c.course_id)}>{profile.completed_ids.includes(c.course_id)&&<Check size={12}/>} {c.name}</button>)}</div>:<div className="catalog-message" role="status">{catalogState==="loading"?"과목 목록을 불러오는 중입니다…":"과목 목록을 불러오지 못했습니다."}{catalogState==="error"&&<button type="button" className="text-button" onClick={()=>{setCatalogState("loading");setCatalogRetry(v=>v+1);}}>다시 시도</button>}</div>}</div><details className="optional"><summary>선택 정보 <ChevronDown size={14}/></summary><div className="field-grid"><label>MBTI (선택)<input maxLength={4} value={profile.mbti} onChange={e=>update("mbti",e.target.value)}/></label><label>성별 (선택)<input maxLength={30} value={profile.gender} onChange={e=>update("gender",e.target.value)}/></label></div><p>추천 점수 계산에는 사용하지 않습니다.</p></details></>}
          {step===1 && <><div className="career-grid">{careers.map(c=><button type="button" key={c} className={(customCareer?c==="직접 입력":profile.career===c)?"career-card selected":"career-card"} onClick={()=>{setCustomCareer(c==="직접 입력");update("career",c==="직접 입력"?"":c);}}>{c==="아직 모름"?<Compass size={18}/>:<GraduationCap size={18}/>}<span>{c}</span>{(customCareer?c==="직접 입력":profile.career===c)&&<Check size={15}/>}</button>)}</div>{customCareer&&<label className="full-field">희망 진로<input maxLength={100} required value={profile.career} onChange={e=>update("career",e.target.value)} placeholder="예: 보안 엔지니어"/></label>}<label className="full-field">관심 기술 / 분야 (선택)<input maxLength={300} value={profile.interests} onChange={e=>update("interests",e.target.value)} placeholder="예: 로봇, IoT, Linux"/></label><p className="field-note">관심 분야는 프로필에 기록해요. 현재 점수는 선택한 진로 태그를 기준으로 계산합니다.</p><Range label="진로 확신도" description="아직 탐색 중이어도 좋아요" value={profile.career_confidence} onChange={v=>update("career_confidence",v)}/></>}
          {step===2 && <div className="range-grid">{learningLabels.map(([key,label,description])=><Range key={key} label={label} description={description} value={profile.learning[key]} onChange={v=>update("learning",{...profile.learning,[key]:v})}/>)}</div>}
          {step===3 && <><Chips label="꼭 지키고 싶은 공강일" selected={profile.free_days} onChange={v=>update("free_days",v)}/><Chips label="선호하는 등교일" selected={profile.preferred_days} onChange={v=>update("preferred_days",v)}/><Chips label="되도록 피하고 싶은 요일" selected={profile.avoided_days} onChange={v=>update("avoided_days",v)}/><div className="field-grid"><label>수업 시간대<select value={profile.time_preference} onChange={e=>update("time_preference",e.target.value as Profile["time_preference"])}><option value="any">상관없어요</option><option value="morning">오전 수업</option><option value="afternoon">오후 수업</option></select></label><label>최대 신청학점<input type="number" required min={1} max={24} value={profile.max_credits} onChange={e=>update("max_credits",Number(e.target.value))}/></label></div><label className="toggle-row"><span><strong>가능하면 몰아 듣기</strong><small>등교일이 늘지 않는 조합을 우선해요</small></span><input type="checkbox" checked={profile.compact_days} onChange={e=>update("compact_days",e.target.checked)}/></label></>}
          {step===4 && <><label className="full-field">병역 계획<select value={profile.military_status} onChange={e=>update("military_status",e.target.value as Profile["military_status"])}><option value="none">해당 없음</option><option value="completed">군필</option><option value="planned">미필 / 계획 있음</option><option value="undecided">미필 / 계획 미정</option></select></label>{profile.military_status==="planned"&&<div className="field-grid"><label>예상 복무 시작<input maxLength={40} value={profile.service_start} onChange={e=>update("service_start",e.target.value)} placeholder="예: 다음 학년 1학기"/></label><label>복무기간 (개월)<input type="number" required min={1} max={36} value={profile.service_months} onChange={e=>update("service_months",Number(e.target.value))}/></label><label>예상 복학 시점<input maxLength={40} value={profile.return_term} onChange={e=>update("return_term",e.target.value)} placeholder="예: 복무 후 2학기"/></label></div>}<div className="info-box"><Leaf size={19}/><p>이번 MVP는 복무 계획이 있으면 기초 과목에 학업계획 가점을 줍니다. 복무 전후 학기별 로드맵은 후속 기능입니다.</p></div><div className="course-picker"><h3>이번 학기 꼭 듣고 싶은 과목</h3><p>필수로 배치해요. 조건 때문에 불가능하면 결과에서 알려드립니다.</p><div className="course-chips">{courses.filter(c=>!profile.completed_ids.includes(c.course_id)).map(c=><button type="button" key={c.course_id} className={profile.required_ids.includes(c.course_id)?"chip selected":"chip"} aria-pressed={profile.required_ids.includes(c.course_id)} onClick={()=>toggleCourse("required_ids",c.course_id)}>{c.name}</button>)}</div></div></>}
          {step===5 && <><div className="range-grid">{campusLabels.map(([key,label,desc])=><Range key={key} label={label} description={desc} value={profile.campus[key]} onChange={v=>update("campus",{...profile.campus,[key]:v})}/>)}</div><div className="info-box"><Sparkles size={19}/><p>준비됐어요! 진로와 학습성향에 맞는 과목을 찾고, 수강 실패에 대비한 다음 선택까지 확인해 보세요.</p></div></>}
          {error&&<div role="alert" className="error-box">{error}</div>}<div className="form-bottom"><button type="button" className="text-button" onClick={()=>step>0?setStep(step-1):setView("landing")}><ArrowLeft size={16}/>{step>0?"이전 질문":"홈으로"}</button><button className="primary" type="submit" disabled={busy}>{busy?<><LoaderCircle className="spin" size={17}/>수강전략 계산 중</>:step<5?<>다음 질문 <ArrowRight size={17}/></>:<>내 추천 확인하기 <Sparkles size={17}/></>}</button></div>
        </form></div>
      </section>}

      {view==="result"&&result&&<section className="results"><div className="result-heading"><div><span className="eyebrow"><Sparkles size={14}/> YOUR SEMESTER STRATEGY</span><h1>이번 학기, 너의 다음 선택.</h1><p>{profile.career==="아직 모름"?"새로운 가능성을 탐색하는":profile.career+"에 가까워지는"} 수강전략을 준비했어요.</p></div><button className="secondary" disabled={busy} onClick={()=>{setView("profile");setStep(0);setError("");}}>프로필 수정 <ArrowUpRight size={16}/></button></div>
        <div className="summary-row"><div><small>추천 과목</small><strong>{result.recommendations.length}<span>개</span></strong></div><div><small>총 신청학점</small><strong>{result.total_credits}<span>/ {result.max_credits}학점</span></strong></div><div><small>나를 위한 공강</small><strong className="free-summary">{result.free_days.length?result.free_days.join(" · "):"없음"}<span>{result.free_days.length?"요일":""}</span></strong></div><div className="summary-check"><ShieldCheck size={25}/><span>시간 충돌 · 학점 제한<br/><strong>검증 완료</strong></span></div></div>
        <div className="result-meta"><span><span className="status-dot"/> {result.explanation_mode==="template"?"계산 근거 기반 설명":"AI가 선택한 계산 근거 기반 설명"}</span><span>가상 과목 25개 · 대학 공식 수강정보가 아닙니다</span></div>
        {notice&&<div role="status" className="notice-box"><Check size={17}/>{notice}</div>}{error&&<div role="alert" className="error-box">{error}</div>}{result.warnings.map(w=><div className="warning-box" key={w}>{w}</div>)}
        {busy&&<div className="busy-banner" role="status"><LoaderCircle className="spin" size={18}/>조건을 다시 확인하고 있어요…</div>}
        <div className="recommendation-grid">{result.recommendations.map((row,index)=><article className={`recommendation-card ${row.status==="success"?"registered":""}`} key={row.course.course_id} data-testid="course-card"><div className="card-top"><span className="course-category">{row.course.category} · {row.course.credits}학점</span><span className="course-order">{row.status==="success"?<><Check size={14}/> 수강 성공</>:String(index+1).padStart(2,"0")}</span></div><div className="course-title-row"><div><h2>{row.course.name}</h2><p>{schedule(row.course)} · {row.course.professor}</p></div><div className="fit-score">{row.score.total}<small>FIT SCORE</small></div></div><div className="score-grid">{Object.entries(row.score.parts).map(([key,value])=><div key={key}><span>{partLabels[key as keyof typeof partLabels]}</span><b>{value}</b><i><em style={{width:`${value}%`}}/></i></div>)}</div><div className="reason"><Sparkles size={15}/><p>{row.reason}</p></div><details className="course-details"><summary>수업 및 평가 정보 <ChevronDown size={14}/></summary><p>{row.course.syllabus}</p><p>시험 {row.course.assessment.exam}% · 과제 {row.course.assessment.assignment}% · 프로젝트 {row.course.assessment.project}%</p></details><div className="alternatives"><span className="alt-heading">NEXT CHOICES <small>전체 시간표 기준 개별 대체 후보</small></span>{row.alternatives.length?row.alternatives.map((alt,i)=><div className="alternative-row" key={alt.course.course_id}><span className="plan-label">PLAN {String.fromCharCode(66+i)}</span><div><strong>{alt.course.name}</strong><small>{schedule(alt.course)} · {alt.course.credits}학점</small></div><b>{alt.score.total}</b></div>):<p className="empty-alternatives">{row.alternative_notice}</p>}</div><div className="registration-actions"><button disabled={busy} className={row.status==="success"?"success-button active":"success-button"} onClick={()=>void requestRecommendations(undefined,row.status==="success"?result.successful_ids.filter(id=>id!==row.course.course_id):[...result.successful_ids,row.course.course_id])}><Check size={15}/>{row.status==="success"?"성공 해제":"수강 성공"}</button><button className="fail-button" disabled={busy||row.status==="success"} onClick={()=>void requestRecommendations(row.course.course_id)}><X size={15}/>수강 실패 → 재추천</button></div></article>)}</div>
        {!result.recommendations.length&&<div className="empty-state"><Compass size={32}/><h2>지금 조건에 맞는 과목이 없어요.</h2><p>공강일, 선수과목, 최대학점을 확인하고 프로필을 조정해 주세요.</p></div>}
        <details className="excluded-list"><summary>추천에서 제외된 과목과 이유 ({result.excluded.length}) <ChevronDown size={15}/></summary>{result.excluded.map(c=><div key={c.course_id}><span>{c.name}</span><span>{c.reason}</span></div>)}</details><div className="result-bottom"><p>점수는 진로 30% · 학습 25% · 평가 15% · 시간표 15% · 대학생활 10% · 학업계획 5%로 계산합니다.<br/>대체 후보는 한 과목씩 교체할 때 유효합니다. 실제 실패 시 전체 조합을 다시 검증합니다.</p><button className="secondary" disabled={busy} onClick={()=>void requestRecommendations()}>수강 상태 초기화 <RotateCcw size={15}/></button></div>
      </section>}
    </main><footer><span className="footer-brand">딸깍.</span><p>나를 아는 선택이, 나다운 학기를 만든다.</p><span>AI BUILDER CHALLENGE 2026</span></footer>
  </div>;
}
