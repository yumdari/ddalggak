// 프로필과 공고를 비교해 적합도 점수와 추천 이유를 만든다.
// 지금은 규칙 기반이고, AI 분석이 붙으면 같은 Recommendation 형태로 돌려주면 된다.
import type { Field, Major, Opportunity } from "./data";
import { gradeLabel } from "./data";

export type Profile = {
  major: Major | "";
  grade: number; // 1~4, 5 = 대학원생
  fields: Field[];
  skills: string[];
};

export type Recommendation = {
  item: Opportunity;
  score: number; // 0~100
  reasons: string[];
};

export type RecommendResult = {
  list: Recommendation[];
  excluded: { item: Opportunity; reason: string }[];
};

export function recommend(items: Opportunity[], p: Profile): RecommendResult {
  const list: Recommendation[] = [];
  const excluded: RecommendResult["excluded"] = [];

  for (const item of items) {
    if (item.deadlineOffset < 0) continue; // 마감된 공고는 추천하지 않는다

    if (item.grades.length > 0 && !item.grades.includes(p.grade)) {
      excluded.push({ item, reason: `${item.grades.map(gradeLabel).join("·")}만 지원 가능` });
      continue;
    }

    let score = 0;
    const reasons: string[] = [];

    const fieldHits = item.fields.filter((f) => p.fields.includes(f));
    if (fieldHits.length > 0) {
      score += 30 + 10 * (fieldHits.length - 1);
      reasons.push(`관심 분야 '${fieldHits.join("', '")}'와 일치해요.`);
    }

    if (p.major && item.majors.includes(p.major)) {
      score += 25;
      reasons.push(`${p.major} 전공을 살릴 수 있는 공고예요.`);
    } else if (item.majors.length === 0) {
      score += 8;
      reasons.push("전공과 관계없이 지원할 수 있어요.");
    }

    if (item.grades.length > 0) {
      score += 10;
      reasons.push(`${gradeLabel(p.grade)} 대상 공고라 경쟁 범위가 좁아요.`);
    }

    const skillHits = item.skills.filter((s) => p.skills.includes(s));
    if (skillHits.length > 0) {
      score += Math.min(20, 8 * skillHits.length);
      reasons.push(`보유 기술 '${skillHits.join("', '")}'을(를) 활용할 수 있어요.`);
    }

    if (item.deadlineOffset <= 7) {
      score += 5;
      reasons.push(`마감까지 ${item.deadlineOffset}일 남았어요. 서둘러 준비하세요.`);
    }

    if (fieldHits.length === 0 && !(p.major && item.majors.includes(p.major))) continue; // 관련성이 없으면 제외
    list.push({ item, score: Math.min(100, score), reasons });
  }

  list.sort((a, b) => b.score - a.score || a.item.deadlineOffset - b.item.deadlineOffset);
  return { list, excluded };
}
