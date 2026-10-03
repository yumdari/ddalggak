export type Opportunity = {
  id: string;
  title: string;
  source: string;
  sourceUrl: string;
  publishedAt: string | null;
  deadline: string | null;
  field: string;
  description: string;
};

export type SearchOptions = {
  query?: string;
  field?: string;
  deadline?: "all" | "known" | "week";
  sort?: "recent" | "deadline";
  now?: Date;
};

const FIELD_TERMS: Record<string, string[]> = {
  "디자인·콘텐츠": ["디자인", "영상", "콘텐츠", "광고", "미디어", "사진", "웹툰"],
  "AI·데이터": ["AI", "인공지능", "데이터", "소프트웨어", "개발", "코딩", "해커톤"],
  "창업·아이디어": ["창업", "아이디어", "비즈니스", "스타트업", "기획"],
  "사회·환경": ["환경", "기후", "사회", "정책", "봉사", "지속가능"],
  "장학·연구": ["장학", "연구", "학술", "논문", "대학원"],
};

export const FIELDS = Object.keys(FIELD_TERMS);

export function classifyField(text: string): string {
  const lower = text.toLocaleLowerCase("ko");
  let best = "기타";
  let bestScore = 0;
  for (const [field, terms] of Object.entries(FIELD_TERMS)) {
    const score = terms.filter((term) => lower.includes(term.toLocaleLowerCase("ko"))).length;
    if (score > bestScore) {
      best = field;
      bestScore = score;
    }
  }
  return best;
}

function isoDate(year: string, month: string, day: string): string | null {
  const value = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  const parsed = new Date(`${value}T00:00:00+09:00`);
  return Number.isNaN(parsed.valueOf()) || parsed.toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" }) !== value
    ? null
    : value;
}

// Only a year-bearing date tied to a deadline or an application-period end is used.
export function extractDeadline(text: string): string | null {
  const patterns = [
    /(?:접수\s*마감|신청\s*마감|지원\s*마감|마감일|마감)\s*[:：]?\s*(20\d{2})[.\-/년\s]+(\d{1,2})[.\-/월\s]+(\d{1,2})/i,
    /(?:접수|신청|지원|모집)\s*기간[^\n]{0,100}?[~∼][^\n]{0,15}?(20\d{2})[.\-/년\s]+(\d{1,2})[.\-/월\s]+(\d{1,2})/i,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return isoDate(match[1], match[2], match[3]);
  }
  return null;
}

export function daysUntil(date: string | null, now = new Date()): number | null {
  if (!date) return null;
  const today = new Date(now.toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" }) + "T00:00:00+09:00");
  const due = new Date(`${date}T00:00:00+09:00`);
  return Math.round((due.valueOf() - today.valueOf()) / 86_400_000);
}

export function searchOpportunities(items: Opportunity[], options: SearchOptions): Opportunity[] {
  const query = options.query?.trim().toLocaleLowerCase("ko") ?? "";
  const now = options.now ?? new Date();
  const filtered = items.filter((item) => {
    const days = daysUntil(item.deadline, now);
    if (days !== null && days < 0) return false;
    if (query && !`${item.title} ${item.description} ${item.source}`.toLocaleLowerCase("ko").includes(query)) return false;
    if (options.field && options.field !== "all" && item.field !== options.field) return false;
    if (options.deadline === "known" && days === null) return false;
    if (options.deadline === "week" && (days === null || days > 7)) return false;
    return true;
  });
  filtered.sort((a, b) => {
    if (options.sort === "deadline") {
      return (a.deadline ?? "9999-12-31").localeCompare(b.deadline ?? "9999-12-31") || a.title.localeCompare(b.title);
    }
    return (b.publishedAt ?? "").localeCompare(a.publishedAt ?? "") || a.title.localeCompare(b.title);
  });
  return filtered;
}

export type Profile = { major: string; grade: string; interests: string[] };
export type Recommendation = { opportunity: Opportunity; reason: string; score: number };

export function rankOpportunities(items: Opportunity[], profile: Profile): Recommendation[] {
  const terms = [profile.major, ...profile.interests].map((value) => value.trim()).filter(Boolean);
  return items.map((opportunity) => {
    const text = `${opportunity.title} ${opportunity.description}`.toLocaleLowerCase("ko");
    const matching = terms.filter((term) => text.includes(term.toLocaleLowerCase("ko")));
    const fieldMatch = profile.interests.includes(opportunity.field);
    const score = matching.length * 10 + (fieldMatch ? 6 : 0);
    const reason = matching.length
      ? `입력한 ${matching.slice(0, 2).join("·")} 관련 표현이 공고에 있습니다.`
      : fieldMatch
        ? `관심 분야 ${opportunity.field}로 분류된 공고입니다.`
        : "새로운 분야의 공고입니다. 지원 자격은 원문에서 확인하세요.";
    return { opportunity, reason, score };
  }).sort((a, b) => b.score - a.score || (b.opportunity.publishedAt ?? "").localeCompare(a.opportunity.publishedAt ?? ""));
}
