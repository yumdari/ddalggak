// 수강신청 플랜 A·B·C 생성과 신청 실패 시 다음 플랜 계산.
// 희망 과목을 우선순위대로 탐색해 시간 충돌·학점 상한·선수과목을 지키는 조합을 찾고,
// 목표 학점에 모자라면 희망 목록 밖의 과목으로 채운다.
import { catalog, courseByCode, type Course, type Section } from "./data";

export type PlanItem = { course: Course; section: Section; filler: boolean };
export type Skipped = { course: Course; reason: string };
export type Plan = { items: PlanItem[]; credits: number; skipped: Skipped[]; score: number };

export type PlanInput = {
  wish: string[]; // 우선순위 순서
  target: number;
  max: number;
  completed: string[];
  closed: string[]; // 마감된 분반 key
  locked: string[]; // 이미 신청에 성공해 고정된 분반 key
};

export const keyOf = (c: Course, s: Section) => `${c.code}-${s.no}`;

const overlaps = (a: Section, b: Section) =>
  a.slots.some((x) => b.slots.some((y) => x.d === y.d && x.s < y.s + y.l && y.s < x.s + x.l));

const fits = (items: PlanItem[], s: Section) => items.every((it) => !overlaps(it.section, s));

export function prereqMissing(input: PlanInput) {
  return input.wish
    .map(courseByCode)
    .filter((c): c is Course => !!c && !!c.prereq && !input.completed.includes(c.prereq));
}

export function generatePlans(input: PlanInput): Plan[] {
  const missing = new Set(prereqMissing(input).map((c) => c.code));
  const wish = input.wish.map(courseByCode).filter((c): c is Course => !!c && !missing.has(c.code));
  const n = wish.length;
  const openSections = (c: Course) => c.sections.filter((s) => !input.closed.includes(keyOf(c, s)));

  // 1) 희망 과목 조합 전수 탐색 (과목당 분반 선택 또는 제외)
  const combos: { items: PlanItem[]; weight: number }[] = [];
  const walk = (i: number, items: PlanItem[], credits: number, weight: number) => {
    if (i === n) {
      combos.push({ items: [...items], weight });
      return;
    }
    const c = wish[i];
    const lockedSec = c.sections.find((s) => input.locked.includes(keyOf(c, s)));
    const options = lockedSec ? [lockedSec] : openSections(c);
    for (const s of options) {
      if (credits + c.credits > input.max || !fits(items, s)) continue;
      items.push({ course: c, section: s, filler: false });
      walk(i + 1, items, credits + c.credits, weight + (n - i) * 10 + 20);
      items.pop();
    }
    if (!lockedSec) walk(i + 1, items, credits, weight);
  };
  walk(0, [], 0, 0);

  combos.sort((a, b) => b.weight - a.weight);

  // 2) 상위 조합마다 목표 학점까지 채우고 점수 매기기
  const plans: Plan[] = [];
  const seen = new Set<string>();
  for (const combo of combos.slice(0, 200)) {
    const items = [...combo.items];
    let credits = items.reduce((sum, it) => sum + it.course.credits, 0);
    const skippedWish = wish.filter((c) => !items.some((it) => it.course.code === c.code));
    const wantCats = new Set(skippedWish.map((c) => c.category));

    const fillers = catalog
      .filter((c) => !input.wish.includes(c.code) && (!c.prereq || input.completed.includes(c.prereq)))
      .sort((a, b) => Number(wantCats.has(b.category)) - Number(wantCats.has(a.category)) || b.credits - a.credits);
    for (const c of fillers) {
      if (credits >= input.target) break;
      if (credits + c.credits > input.target) continue;
      const s = openSections(c).find((sec) => fits(items, sec));
      if (s) {
        items.push({ course: c, section: s, filler: true });
        credits += c.credits;
      }
    }

    const key = items.map((it) => keyOf(it.course, it.section)).sort().join("|");
    if (seen.has(key)) continue;
    seen.add(key);

    const score = combo.weight + items.filter((it) => it.filler).length * 5 - Math.abs(input.target - credits) * 6;
    const skipped = skippedWish.map((c) => ({ course: c, reason: skipReason(c, items, credits, input) }));
    plans.push({ items, credits, skipped, score });
  }

  // 3) A는 최고점, B·C는 앞선 플랜과 겹치는 분반이 적을수록 우대해 실제 대안이 되게 고른다
  plans.sort((a, b) => b.score - a.score);
  const picked: Plan[] = [];
  const keys = (p: Plan) => new Set(p.items.map((it) => keyOf(it.course, it.section)));
  while (picked.length < 3 && plans.length > 0) {
    let best = 0;
    let bestVal = -Infinity;
    plans.forEach((p, i) => {
      const k = keys(p);
      const overlap = picked.reduce((sum, q) => sum + [...keys(q)].filter((x) => k.has(x) && !input.locked.includes(x)).length, 0);
      const val = p.score - overlap * 8;
      if (val > bestVal) {
        bestVal = val;
        best = i;
      }
    });
    picked.push(plans.splice(best, 1)[0]);
  }
  return picked;
}

function skipReason(c: Course, items: PlanItem[], credits: number, input: PlanInput) {
  const open = c.sections.filter((s) => !input.closed.includes(keyOf(c, s)));
  if (open.length === 0) return "모든 분반 마감";
  if (open.every((s) => !fits(items, s))) {
    const clash = items.find((it) => open.some((s) => overlaps(it.section, s)));
    return clash ? `${clash.course.name}와(과) 시간 충돌` : "시간 충돌";
  }
  if (credits + c.credits > input.max) return "학점 상한 초과";
  return "우선순위가 낮아 다른 조합에 배정";
}

// 신청 실패 후 이전 플랜과 새 플랜을 비교해 변경 이유를 만든다
export function explainSwitch(prev: Plan, next: Plan, closedKey: string): string[] {
  const reasons: string[] = [];
  const prevKeys = new Set(prev.items.map((it) => keyOf(it.course, it.section)));
  const nextKeys = new Set(next.items.map((it) => keyOf(it.course, it.section)));
  const added = next.items.filter((it) => !prevKeys.has(keyOf(it.course, it.section)));
  const removed = prev.items.filter((it) => !nextKeys.has(keyOf(it.course, it.section)));
  const failed = prev.items.find((it) => keyOf(it.course, it.section) === closedKey);

  if (failed) {
    const same = added.find((it) => it.course.code === failed.course.code);
    if (same) {
      reasons.push(`${failed.course.name} ${failed.section.no}분반이 마감되어 ${same.section.no}분반(${same.section.prof})으로 바꿨어요. 이 분반은 남은 시간표와 겹치지 않아요.`);
    } else {
      reasons.push(`${failed.course.name}은(는) 남은 시간표에 맞는 분반이 없어 이번 플랜에서 뺐어요.`);
    }
  }
  for (const it of added) {
    if (failed && it.course.code === failed.course.code) continue;
    const why = failed && it.course.category === failed.course.category ? `같은 ${it.course.category} 과목으로` : "빈 학점을 채우려고";
    reasons.push(`${why} ${it.course.name} ${it.section.no}분반(${it.course.credits}학점)을 넣었어요.`);
  }
  for (const it of removed) {
    if (it === failed) continue;
    reasons.push(`${it.course.name}은(는) 새 조합과 시간이 겹쳐 뺐어요.`);
  }
  reasons.push(`학점은 ${prev.credits}학점 → ${next.credits}학점이에요.`);
  return reasons;
}
