// 학사 일정·개설 과목 샘플 데이터.
// 학사 일정은 PRD대로 공지를 확인해 직접 입력하는 방식이며, 날짜는 오늘 기준 상대 일수로 둔다.

export type EventType = "수강신청" | "정정" | "종합시험" | "학사";

export type AcademicEvent = {
  id: string;
  title: string;
  type: EventType;
  startOffset: number;
  endOffset: number;
  source: string; // 출처 공지
  note: string;
};

export const events: AcademicEvent[] = [
  { id: "ev-cart", title: "예비 수강신청(장바구니)", type: "수강신청", startOffset: -2, endOffset: 1, source: "학사 공지 · 수강신청 안내", note: "장바구니에 담은 과목은 본 신청 때 우선 확인할 수 있어요." },
  { id: "ev-reg", title: "수강신청 (본 신청)", type: "수강신청", startOffset: 7, endOffset: 9, source: "학사 공지 · 수강신청 안내", note: "학년별로 신청 시작 시각이 달라요. 오전 10시부터 진행돼요." },
  { id: "ev-exam", title: "종합시험 응시 신청", type: "종합시험", startOffset: 1, endOffset: 3, source: "대학원 공지 · 종합시험 시행 안내", note: "응시 자격(이수 학점·지도교수 승인)을 먼저 확인하세요." },
  { id: "ev-leave", title: "휴·복학 신청", type: "학사", startOffset: 0, endOffset: 5, source: "학사 공지 · 휴복학 안내", note: "포털에서 신청 후 학과 승인이 필요해요." },
  { id: "ev-fix", title: "수강 정정 기간", type: "정정", startOffset: 21, endOffset: 23, source: "학사 공지 · 수강신청 안내", note: "정정 기간에는 빈자리가 생기면 선착순으로 신청할 수 있어요." },
  { id: "ev-drop", title: "수강 철회 신청", type: "정정", startOffset: 45, endOffset: 47, source: "학사 공지 · 수강철회 안내", note: "철회한 과목은 성적표에 W로 표시돼요." },
  { id: "ev-grade", title: "지난 학기 성적 공시", type: "학사", startOffset: -12, endOffset: -8, source: "학사 공지 · 성적 처리 일정", note: "이의 신청 기간이 지났어요." },
];

export const DAYS = ["월", "화", "수", "목", "금"] as const;

// 시간 단위: 9:00부터 30분 칸. s = 시작 칸, l = 칸 수 (3칸 = 1시간 30분)
export type Slot = { d: number; s: number; l: number };
export type Section = { no: string; prof: string; slots: Slot[] };
export type CourseCategory = "전공필수" | "전공선택" | "교양";
export type Course = {
  code: string;
  name: string;
  category: CourseCategory;
  credits: number;
  prereq?: string;
  sections: Section[];
};

const tt = (d1: number, d2: number, s: number): Slot[] => [
  { d: d1, s, l: 3 },
  { d: d2, s, l: 3 },
];

// 이수 여부 확인용 과목 (선수과목)
export const pastCourses = [
  { code: "CSE101", name: "프로그래밍기초" },
  { code: "CSE102", name: "이산수학" },
  { code: "CSE201", name: "자료구조" },
  { code: "CSE202", name: "컴퓨터구조" },
  { code: "MAT201", name: "선형대수" },
];

export const catalog: Course[] = [
  { code: "CSE301", name: "운영체제", category: "전공필수", credits: 3, prereq: "CSE201", sections: [{ no: "01", prof: "김교수", slots: tt(0, 2, 0) }, { no: "02", prof: "이교수", slots: tt(1, 3, 12) }] },
  { code: "CSE302", name: "데이터베이스", category: "전공필수", credits: 3, prereq: "CSE201", sections: [{ no: "01", prof: "박교수", slots: tt(0, 2, 3) }, { no: "02", prof: "최교수", slots: tt(1, 3, 0) }] },
  { code: "CSE303", name: "알고리즘", category: "전공필수", credits: 3, prereq: "CSE201", sections: [{ no: "01", prof: "정교수", slots: tt(1, 3, 3) }, { no: "02", prof: "한교수", slots: tt(0, 2, 9) }] },
  { code: "CSE311", name: "인공지능", category: "전공선택", credits: 3, prereq: "MAT201", sections: [{ no: "01", prof: "윤교수", slots: tt(1, 3, 9) }, { no: "02", prof: "서교수", slots: tt(2, 4, 3) }] },
  { code: "CSE312", name: "웹프로그래밍", category: "전공선택", credits: 3, sections: [{ no: "01", prof: "강교수", slots: tt(0, 2, 9) }, { no: "02", prof: "조교수", slots: [{ d: 4, s: 8, l: 6 }] }] },
  { code: "CSE313", name: "컴퓨터네트워크", category: "전공선택", credits: 3, prereq: "CSE202", sections: [{ no: "01", prof: "임교수", slots: tt(1, 3, 0) }, { no: "02", prof: "오교수", slots: tt(0, 2, 12) }] },
  { code: "CSE314", name: "소프트웨어공학", category: "전공선택", credits: 3, sections: [{ no: "01", prof: "신교수", slots: tt(2, 4, 9) }] },
  { code: "CSE315", name: "모바일프로그래밍", category: "전공선택", credits: 3, sections: [{ no: "01", prof: "권교수", slots: tt(1, 3, 12) }, { no: "02", prof: "황교수", slots: [{ d: 4, s: 0, l: 6 }] }] },
  { code: "CSE316", name: "정보보호", category: "전공선택", credits: 3, sections: [{ no: "01", prof: "안교수", slots: tt(0, 2, 12) }] },
  { code: "MAT201", name: "선형대수", category: "전공선택", credits: 3, sections: [{ no: "01", prof: "송교수", slots: tt(1, 3, 9) }] },
  { code: "GEN101", name: "글쓰기와 소통", category: "교양", credits: 2, sections: [{ no: "01", prof: "유교수", slots: [{ d: 1, s: 15, l: 4 }] }, { no: "02", prof: "홍교수", slots: [{ d: 3, s: 15, l: 4 }] }] },
  { code: "GEN205", name: "창업과 혁신", category: "교양", credits: 2, sections: [{ no: "01", prof: "문교수", slots: [{ d: 4, s: 12, l: 4 }] }, { no: "02", prof: "양교수", slots: [{ d: 2, s: 15, l: 4 }] }] },
  { code: "GEN310", name: "영어 프레젠테이션", category: "교양", credits: 2, sections: [{ no: "01", prof: "배교수", slots: [{ d: 0, s: 15, l: 4 }] }, { no: "02", prof: "백교수", slots: [{ d: 3, s: 15, l: 4 }] }] },
  { code: "GEN120", name: "심리학의 이해", category: "교양", credits: 3, sections: [{ no: "01", prof: "허교수", slots: tt(2, 4, 0) }] },
];

export const exampleWish = ["CSE301", "CSE302", "CSE303", "CSE311", "CSE312", "CSE313", "GEN101"];

export const courseByCode = (code: string) => catalog.find((c) => c.code === code);
export const courseName = (code: string) => courseByCode(code)?.name ?? pastCourses.find((p) => p.code === code)?.name ?? code;

export function slotTime(s: Slot) {
  const fmt = (n: number) => {
    const m = 9 * 60 + n * 30;
    return `${Math.floor(m / 60)}:${String(m % 60).padStart(2, "0")}`;
  };
  return `${DAYS[s.d]} ${fmt(s.s)}-${fmt(s.s + s.l)}`;
}

export function dday(offset: number) {
  if (offset < 0) return `D+${-offset}`;
  if (offset === 0) return "D-Day";
  return `D-${offset}`;
}

export function dateFromOffset(offset: number) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + offset);
  return `${d.getMonth() + 1}.${String(d.getDate()).padStart(2, "0")}(${"일월화수목금토"[d.getDay()]})`;
}
