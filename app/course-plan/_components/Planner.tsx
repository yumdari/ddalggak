"use client";

import { useMemo, useState } from "react";
import { catalog, courseByCode, courseName, exampleWish, pastCourses, slotTime } from "../_lib/data";
import { explainSwitch, generatePlans, keyOf, prereqMissing, type Plan, type PlanInput } from "../_lib/planner";
import Timetable from "./Timetable";

const PLAN_NAMES = ["A", "B", "C"];

type Switch = { failed: string; reasons: string[] };

export default function Planner() {
  const [semester, setSemester] = useState("2027학년도 1학기");
  const [target, setTarget] = useState(18);
  const [max, setMax] = useState(21);
  const [completed, setCompleted] = useState<string[]>(["CSE101", "CSE102", "CSE201", "CSE202"]);
  const [wish, setWish] = useState<string[]>([]);
  const [query, setQuery] = useState("");

  const [plans, setPlans] = useState<Plan[] | null>(null);
  const [active, setActive] = useState(0);
  const [closed, setClosed] = useState<string[]>([]);
  const [locked, setLocked] = useState<string[]>([]);
  const [switches, setSwitches] = useState<Switch[]>([]);

  const input = (over: Partial<PlanInput> = {}): PlanInput => ({ wish, target, max, completed, closed, locked, ...over });
  const missing = useMemo(() => prereqMissing({ wish, target, max, completed, closed: [], locked: [] }), [wish, target, max, completed]);
  const wishCredits = wish.reduce((s, c) => s + (courseByCode(c)?.credits ?? 0), 0);

  function build() {
    setClosed([]);
    setLocked([]);
    setSwitches([]);
    setActive(0);
    setPlans(generatePlans(input({ closed: [], locked: [] })));
  }

  // FR-07: 신청 실패(마감) 표시 → 나머지는 신청 성공으로 고정하고 다음 플랜 계산
  function markClosed(key: string) {
    if (!plans) return;
    const current = plans[active];
    const nextClosed = [...closed, key];
    const nextLocked = Array.from(new Set([...locked, ...current.items.map((it) => keyOf(it.course, it.section)).filter((k) => k !== key)]));
    const next = generatePlans(input({ closed: nextClosed, locked: nextLocked }));
    setClosed(nextClosed);
    setLocked(nextLocked);
    setPlans(next);
    setActive(0);
    if (next[0]) {
      const failed = current.items.find((it) => keyOf(it.course, it.section) === key)!;
      setSwitches((s) => [{ failed: `${failed.course.name} ${failed.section.no}분반`, reasons: explainSwitch(current, next[0], key) }, ...s]);
    }
  }

  const move = (i: number, dir: -1 | 1) =>
    setWish((w) => {
      const j = i + dir;
      if (j < 0 || j >= w.length) return w;
      const next = [...w];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  const filtered = catalog.filter((c) => !query || c.name.includes(query) || c.code.toLowerCase().includes(query.toLowerCase()));
  const plan = plans?.[active];

  return (
    <div className="space-y-10">
      {/* 1단계: 조건 */}
      <section className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
        <div className="space-y-5 rounded-2xl border border-line p-6">
          <StepTitle no={1} title="학기와 학점 목표" />
          <div className="grid grid-cols-3 gap-3 text-sm">
            <label className="col-span-3 sm:col-span-1">
              <span className="text-muted">학기</span>
              <select value={semester} onChange={(e) => setSemester(e.target.value)} className="mt-1 w-full rounded-lg border border-line px-2 py-2">
                <option>2027학년도 1학기</option>
                <option>2027학년도 2학기</option>
              </select>
            </label>
            <label>
              <span className="text-muted">목표 학점</span>
              <input type="number" min={3} max={max} value={target} onChange={(e) => setTarget(Math.min(max, Number(e.target.value)))} className="mt-1 w-full rounded-lg border border-line px-2 py-2" />
            </label>
            <label>
              <span className="text-muted">학점 상한</span>
              <input type="number" min={target} max={24} value={max} onChange={(e) => setMax(Math.max(target, Number(e.target.value)))} className="mt-1 w-full rounded-lg border border-line px-2 py-2" />
            </label>
          </div>
          <div>
            <p className="text-sm text-muted">이수한 과목 (선수과목 확인용)</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {pastCourses.map((p) => {
                const on = completed.includes(p.code);
                return (
                  <button
                    key={p.code}
                    onClick={() => setCompleted((c) => (on ? c.filter((x) => x !== p.code) : [...c, p.code]))}
                    aria-pressed={on}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium ${on ? "bg-brand text-white" : "bg-soft text-muted"}`}
                  >
                    {on ? "✓ " : ""}{p.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 2단계: 희망 과목 */}
        <div className="rounded-2xl border border-line p-6">
          <div className="flex items-center justify-between gap-2">
            <StepTitle no={2} title="희망 과목 (우선순위 순)" />
            <button onClick={() => setWish(exampleWish)} className="shrink-0 text-xs font-medium text-brand-blue hover:underline">예시 불러오기</button>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="과목명·코드 검색" className="w-full rounded-lg border border-line px-3 py-2 text-sm" />
              <ul className="mt-2 max-h-64 divide-y divide-line overflow-y-auto rounded-lg border border-line text-sm">
                {filtered.map((c) => {
                  const added = wish.includes(c.code);
                  return (
                    <li key={c.code} className="flex items-center gap-2 px-3 py-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{c.name}</p>
                        <p className="text-xs text-muted">{c.category} · {c.credits}학점 · 분반 {c.sections.length}개</p>
                      </div>
                      <button
                        onClick={() => setWish((w) => (added ? w.filter((x) => x !== c.code) : [...w, c.code]))}
                        className={`shrink-0 rounded-full px-2.5 py-1 text-xs ${added ? "bg-soft text-muted" : "bg-brand text-white"}`}
                      >
                        {added ? "빼기" : "담기"}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
            <div>
              <p className="text-xs text-muted">담은 과목 {wish.length}개 · {wishCredits}학점</p>
              <ol className="mt-2 space-y-1.5 text-sm">
                {wish.map((code, i) => {
                  const c = courseByCode(code)!;
                  const miss = missing.some((m) => m.code === code);
                  return (
                    <li key={code} className={`flex items-center gap-2 rounded-lg px-3 py-2 ${miss ? "bg-bad-soft" : "bg-soft"}`}>
                      <span className="w-4 text-xs font-bold text-brand">{i + 1}</span>
                      <span className="min-w-0 flex-1 truncate">{c.name}</span>
                      <button onClick={() => move(i, -1)} className="text-muted hover:text-brand" aria-label={`${c.name} 우선순위 올리기`}>▲</button>
                      <button onClick={() => move(i, 1)} className="text-muted hover:text-brand" aria-label={`${c.name} 우선순위 내리기`}>▼</button>
                    </li>
                  );
                })}
                {wish.length === 0 && <li className="rounded-lg border border-dashed border-line px-3 py-8 text-center text-xs text-muted">목록에서 과목을 담아 주세요</li>}
              </ol>
              {missing.length > 0 && (
                <p className="mt-2 text-xs text-bad">
                  선수과목 미이수: {missing.map((m) => `${m.name}(${courseName(m.prereq!)} 필요)`).join(", ")} — 플랜에서 제외돼요.
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="text-center">
        <button
          onClick={build}
          disabled={wish.length === 0}
          className="rounded-full bg-brand px-10 py-4 font-medium text-white hover:bg-brand-mid disabled:cursor-not-allowed disabled:opacity-40"
        >
          플랜 A·B·C 만들기
        </button>
      </div>

      {/* 3단계: 결과 */}
      {plans && (
        <section className="space-y-6">
          <StepTitle no={3} title={`${semester} 추천 플랜`} />

          {switches.length > 0 && (
            <div className="space-y-2">
              {switches.map((s, i) => (
                <div key={i} className={`rounded-2xl p-5 ${i === 0 ? "border-2 border-brand-light bg-brand-tint" : "border border-line opacity-70"}`}>
                  <p className="text-sm font-bold text-brand">
                    {i === 0 ? "다음 플랜으로 전환했어요" : "이전 전환"} · {s.failed} 마감
                  </p>
                  <ul className="mt-2 space-y-1 text-sm">
                    {s.reasons.map((r) => (
                      <li key={r} className="flex gap-2">
                        <span className="text-brand-light">→</span>
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

          {plans.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-line px-6 py-12 text-center text-sm text-muted">조건을 만족하는 플랜이 없어요. 학점 상한을 늘리거나 희망 과목을 바꿔 보세요.</p>
          ) : (
            <>
              <div className="flex gap-2">
                {plans.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => setActive(i)}
                    className={`rounded-xl px-5 py-3 text-left ${active === i ? "bg-brand text-white" : "bg-soft text-brand hover:bg-brand-tint"}`}
                  >
                    <span className="block text-lg font-bold">플랜 {PLAN_NAMES[i]}</span>
                    <span className="text-xs opacity-80">{p.credits}학점 · {p.items.length}과목</span>
                  </button>
                ))}
              </div>

              {plan && (
                <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
                  <Timetable items={plan.items} />
                  <div className="space-y-4">
                    <ul className="space-y-1.5 text-sm">
                      <Check status="ok" text="시간 충돌 없음" />
                      <Check status={plan.credits > max ? "bad" : plan.credits < target ? "warn" : "ok"} text={`학점 ${plan.credits} / 상한 ${max} (목표 ${target})`} />
                      <Check status={missing.length === 0 ? "ok" : "warn"} text={missing.length ? `선수과목 미이수로 제외: ${missing.map((m) => m.name).join(", ")}` : "선수과목 조건 충족"} />
                    </ul>

                    <div className="divide-y divide-line rounded-2xl border border-line">
                      {plan.items.map((it) => {
                        const k = keyOf(it.course, it.section);
                        const isLocked = locked.includes(k);
                        return (
                          <div key={k} className="flex items-center gap-3 px-4 py-3 text-sm">
                            <div className="min-w-0 flex-1">
                              <p className="font-medium">
                                {it.course.name} <span className="text-muted">{it.section.no}분반</span>
                                {it.filler && <span className="ml-1.5 rounded bg-brand-tint px-1.5 py-0.5 text-[11px] text-brand">대체 추천</span>}
                                {isLocked && <span className="ml-1.5 rounded bg-good-soft px-1.5 py-0.5 text-[11px] text-good">신청 완료</span>}
                              </p>
                              <p className="text-xs text-muted">
                                {it.course.category} · {it.course.credits}학점 · {it.section.prof} · {it.section.slots.map(slotTime).join(", ")}
                              </p>
                            </div>
                            {!isLocked && (
                              <button onClick={() => markClosed(k)} className="shrink-0 rounded-full border border-bad/40 px-3 py-1.5 text-xs font-medium text-bad hover:bg-bad-soft">
                                마감됨
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {plan.skipped.length > 0 && (
                      <div className="rounded-xl bg-soft p-4 text-xs">
                        <p className="font-bold text-brand">이 플랜에서 빠진 희망 과목</p>
                        <ul className="mt-1.5 space-y-1 text-muted">
                          {plan.skipped.map((s) => (
                            <li key={s.course.code}>· {s.course.name}: {s.reason}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <p className="rounded-xl bg-brand-tint px-4 py-3 text-xs text-brand">
                      수강신청 당일, 신청에 실패한 과목의 <b>마감됨</b>을 누르면 남은 학점과 시간표를 반영해 다음 플랜을 바로 알려 드려요.
                      실제 신청은 학교 수강신청 시스템에서 직접 해 주세요.
                    </p>
                    {closed.length > 0 && (
                      <button onClick={build} className="text-xs font-medium text-brand-blue hover:underline">처음 플랜으로 되돌리기</button>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      )}
    </div>
  );
}

function StepTitle({ no, title }: { no: number; title: string }) {
  return (
    <p className="flex items-center gap-2 font-bold text-brand">
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-light text-xs text-white">{no}</span>
      {title}
    </p>
  );
}

function Check({ status, text }: { status: "ok" | "warn" | "bad"; text: string }) {
  const color = status === "ok" ? "text-good" : status === "warn" ? "text-brand-blue" : "text-bad";
  return (
    <li className="flex gap-2">
      <span className={color}>{status === "ok" ? "✓" : "!"}</span>
      <span>{text}</span>
    </li>
  );
}
