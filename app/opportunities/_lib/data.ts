// 공고 데이터 타입과 샘플 데이터.
// 실제 수집(공개 API·허용 범위 웹 데이터 → MySQL)이 붙기 전까지 화면과 로직 확인용으로 쓴다.
// 날짜는 오늘 기준 상대 일수로 두어 언제 열어도 D-Day가 자연스럽게 보이게 한다.

export const CATEGORIES = ["공모전", "대외활동", "해커톤", "장학금"] as const;
export type Category = (typeof CATEGORIES)[number];

export const FIELDS = ["IT·SW", "AI·데이터", "디자인", "마케팅·기획", "경영·경제", "사회·환경", "인문·문화", "과학·공학"] as const;
export type Field = (typeof FIELDS)[number];

export const MAJORS = [
  "컴퓨터·소프트웨어",
  "전자·기계·공학",
  "경영·경제",
  "디자인·미술",
  "인문·사회",
  "자연과학",
  "미디어·커뮤니케이션",
] as const;
export type Major = (typeof MAJORS)[number];

export const SKILLS = ["Python", "JavaScript", "데이터 분석", "UI/UX", "영상 편집", "글쓰기", "발표", "기획서 작성", "하드웨어"] as const;

export type Opportunity = {
  id: string;
  title: string;
  host: string;
  source: string; // 수집 출처
  category: Category;
  fields: Field[];
  majors: Major[]; // 비어 있으면 전공 무관
  grades: number[]; // 지원 가능 학년. 비어 있으면 제한 없음 (5 = 대학원생)
  skills: string[];
  startOffset: number; // 접수 시작 (오늘 기준 일수)
  deadlineOffset: number; // 접수 마감 (오늘 기준 일수)
  prize: string;
  eligibility: string;
  schedule: string;
  submission: string[];
  notice: string; // 원문 공고 (요약 전)
};

export const opportunities: Opportunity[] = [
  {
    id: "op-01",
    title: "생성형 AI 활용 아이디어 공모전",
    host: "한빛디지털재단",
    source: "공모전 포털",
    category: "공모전",
    fields: ["AI·데이터", "IT·SW"],
    majors: ["컴퓨터·소프트웨어", "전자·기계·공학"],
    grades: [],
    skills: ["Python", "기획서 작성"],
    startOffset: -20,
    deadlineOffset: 3,
    prize: "대상 500만 원 외 총상금 1,500만 원",
    eligibility: "국내 대학(원) 재학생·휴학생, 개인 또는 4인 이하 팀",
    schedule: "서류 심사 후 본선 발표, 마감 3주 뒤 시상",
    submission: ["아이디어 기획서(10쪽 이내)", "시연 영상(선택)"],
    notice:
      "본 공모전은 생성형 AI를 활용하여 일상과 사회의 문제를 해결하는 창의적인 아이디어를 발굴하기 위해 개최합니다. 참가 대상은 국내 대학 및 대학원에 재학 중이거나 휴학 중인 학생으로, 개인 또는 최대 4인으로 구성된 팀으로 참가할 수 있습니다. 제출물은 10쪽 이내의 아이디어 기획서이며, 시연 영상은 선택 사항입니다. 1차 서류 심사를 통과한 팀은 본선 발표를 진행하며, 시상은 접수 마감 약 3주 후에 진행됩니다. 시상 내역은 대상 500만 원을 포함하여 총상금 1,500만 원 규모입니다.",
  },
  {
    id: "op-02",
    title: "청년 소셜벤처 서포터즈 12기",
    host: "푸른내일 사회혁신센터",
    source: "대외활동 커뮤니티",
    category: "대외활동",
    fields: ["사회·환경", "마케팅·기획"],
    majors: [],
    grades: [1, 2, 3, 4],
    skills: ["영상 편집", "글쓰기"],
    startOffset: -10,
    deadlineOffset: 9,
    prize: "월 활동비 20만 원, 수료증, 우수 활동자 시상",
    eligibility: "대학생(1~4학년), SNS 콘텐츠 제작에 관심 있는 누구나",
    schedule: "서류 → 온라인 면접 → 발대식, 4개월 활동",
    submission: ["지원서", "SNS 활동 링크(선택)"],
    notice:
      "사회혁신 기업의 이야기를 콘텐츠로 알릴 서포터즈를 모집합니다. 대학교 1학년부터 4학년까지 지원 가능하며, 전공은 무관합니다. 선발된 서포터즈는 4개월 동안 소셜벤처 현장을 취재하고 카드뉴스와 영상을 제작합니다. 매월 활동비 20만 원이 지급되며, 활동을 마치면 수료증이 발급되고 우수 활동자는 별도로 시상합니다. 서류 심사 후 온라인 면접을 거쳐 최종 선발됩니다.",
  },
  {
    id: "op-03",
    title: "캠퍼스 오픈데이터 해커톤",
    host: "미래교육데이터협회",
    source: "해커톤 모음",
    category: "해커톤",
    fields: ["AI·데이터", "IT·SW"],
    majors: ["컴퓨터·소프트웨어", "자연과학"],
    grades: [],
    skills: ["Python", "JavaScript", "데이터 분석"],
    startOffset: -5,
    deadlineOffset: 14,
    prize: "대상 300만 원, 우수 팀 인턴십 연계",
    eligibility: "대학(원)생 3~5인 팀, 개발자 1인 이상 포함",
    schedule: "본 대회 무박 2일, 마감 2주 뒤 진행",
    submission: ["팀 참가 신청서", "본선 결과물(소스코드·발표자료)"],
    notice:
      "공공·교육 오픈데이터를 활용해 캠퍼스 문제를 해결하는 서비스를 무박 2일 동안 개발하는 해커톤입니다. 대학 및 대학원생 3~5인으로 구성된 팀만 참가할 수 있으며, 팀에는 개발자가 1인 이상 포함되어야 합니다. 대회는 접수 마감 2주 후 진행되며 참가 신청서를 먼저 제출하고, 본선에서 소스코드와 발표자료를 제출합니다. 대상 팀에게는 300만 원이 수여되며 우수 팀에게는 협력 기관 인턴십 기회가 연계됩니다.",
  },
  {
    id: "op-04",
    title: "지역상생 브랜드 디자인 공모전",
    host: "새봄지역문화원",
    source: "공모전 포털",
    category: "공모전",
    fields: ["디자인", "인문·문화"],
    majors: ["디자인·미술", "미디어·커뮤니케이션"],
    grades: [],
    skills: ["UI/UX"],
    startOffset: -15,
    deadlineOffset: 21,
    prize: "최우수 200만 원, 수상작 실제 브랜드 적용",
    eligibility: "대학생 및 일반인, 개인 참가",
    schedule: "온라인 접수 → 1차 심사 → 공개 투표 → 시상",
    submission: ["디자인 시안(A3, PDF)", "디자인 설명서(1쪽)"],
    notice:
      "지역 특산물과 관광지를 알리는 브랜드 아이덴티티 디자인을 공모합니다. 대학생과 일반인 누구나 개인으로 참가할 수 있습니다. A3 크기의 디자인 시안을 PDF로 제출하고 1쪽 분량의 디자인 설명서를 함께 첨부해야 합니다. 1차 심사 후 공개 투표를 거쳐 최종 수상작을 선정하며, 최우수작에는 200만 원이 수여되고 실제 지역 브랜드에 적용됩니다.",
  },
  {
    id: "op-05",
    title: "미래인재 학업장려 장학금",
    host: "늘봄장학회",
    source: "장학금 정보센터",
    category: "장학금",
    fields: ["과학·공학", "IT·SW"],
    majors: ["컴퓨터·소프트웨어", "전자·기계·공학", "자연과학"],
    grades: [2, 3],
    skills: [],
    startOffset: -7,
    deadlineOffset: 6,
    prize: "학기당 등록금 전액(최대 2학기)",
    eligibility: "이공계열 2~3학년, 직전 학기 평점 3.5 이상",
    schedule: "서류 심사 → 면접 → 최종 발표",
    submission: ["장학 신청서", "성적증명서", "학업계획서"],
    notice:
      "이공계열 우수 학생의 학업을 지원하기 위한 장학생을 선발합니다. 지원 자격은 이공계열 2학년 또는 3학년 재학생으로 직전 학기 평점이 3.5 이상이어야 합니다. 선발된 학생에게는 최대 2개 학기 동안 등록금 전액을 지원합니다. 장학 신청서, 성적증명서, 학업계획서를 제출해야 하며 서류 심사와 면접을 거쳐 최종 선발합니다.",
  },
  {
    id: "op-06",
    title: "대학생 마케팅 전략 경진대회",
    host: "바른소비자연구소",
    source: "공모전 포털",
    category: "공모전",
    fields: ["마케팅·기획", "경영·경제"],
    majors: ["경영·경제", "미디어·커뮤니케이션"],
    grades: [],
    skills: ["기획서 작성", "발표", "데이터 분석"],
    startOffset: -12,
    deadlineOffset: 11,
    prize: "대상 300만 원, 수상팀 서류전형 우대",
    eligibility: "대학(원)생 2~4인 팀",
    schedule: "기획서 심사 → 본선 PT → 시상",
    submission: ["마케팅 전략 기획서(PPT 20장 이내)"],
    notice:
      "제시된 친환경 생활용품 브랜드의 20대 고객 확대 전략을 제안하는 경진대회입니다. 대학 및 대학원생 2~4인 팀으로 참가하며, 20장 이내의 PPT 기획서를 제출합니다. 기획서 심사를 통과한 팀은 본선에서 발표를 진행합니다. 대상 팀에게는 300만 원이 수여되고 수상팀 전원은 협력사 채용 시 서류전형 우대 혜택을 받습니다.",
  },
  {
    id: "op-07",
    title: "임베디드 로봇 챌린지",
    host: "한결공학교육원",
    source: "해커톤 모음",
    category: "해커톤",
    fields: ["과학·공학", "IT·SW"],
    majors: ["전자·기계·공학", "컴퓨터·소프트웨어"],
    grades: [2, 3, 4, 5],
    skills: ["하드웨어", "Python"],
    startOffset: -3,
    deadlineOffset: 25,
    prize: "대상 400만 원, 키트 무상 제공",
    eligibility: "공학계열 2학년 이상 또는 대학원생, 2~4인 팀",
    schedule: "예선(온라인 미션) → 본선(오프라인 경기)",
    submission: ["참가 신청서", "예선 미션 결과 영상"],
    notice:
      "제공되는 임베디드 키트로 자율주행 로봇을 제작해 미션을 수행하는 대회입니다. 공학계열 2학년 이상 학부생 또는 대학원생 2~4인 팀으로 참가합니다. 예선은 온라인 미션 결과 영상으로 심사하며, 본선은 오프라인 경기로 진행합니다. 참가팀에는 키트를 무상으로 제공하고 대상 팀에는 400만 원을 수여합니다.",
  },
  {
    id: "op-08",
    title: "글로벌 문화교류 기자단",
    host: "세계청년교류협회",
    source: "대외활동 커뮤니티",
    category: "대외활동",
    fields: ["인문·문화", "사회·환경"],
    majors: ["인문·사회", "미디어·커뮤니케이션"],
    grades: [],
    skills: ["글쓰기", "영상 편집"],
    startOffset: -18,
    deadlineOffset: 1,
    prize: "해외 탐방 기회, 원고료 지급",
    eligibility: "대학생 및 휴학생, 외국어 가능자 우대",
    schedule: "서류 → 면접 → 6개월 활동",
    submission: ["지원서", "기사 작성 샘플 1편"],
    notice:
      "국내외 문화교류 현장을 취재할 청년 기자단을 모집합니다. 대학생과 휴학생 누구나 지원할 수 있으며 외국어 가능자는 우대합니다. 지원서와 함께 기사 작성 샘플 1편을 제출해야 합니다. 선발된 기자단은 6개월간 활동하며 원고료가 지급되고, 우수 기자에게는 해외 탐방 기회가 주어집니다.",
  },
  {
    id: "op-09",
    title: "모바일 앱 UX 개선 공모전",
    host: "누리IT협동조합",
    source: "공모전 포털",
    category: "공모전",
    fields: ["디자인", "IT·SW"],
    majors: ["디자인·미술", "컴퓨터·소프트웨어"],
    grades: [],
    skills: ["UI/UX", "기획서 작성"],
    startOffset: -2,
    deadlineOffset: 30,
    prize: "대상 250만 원, 우수작 실제 서비스 반영",
    eligibility: "대학(원)생 개인 또는 3인 이하 팀",
    schedule: "접수 → 심사 → 결과 발표",
    submission: ["UX 개선 제안서", "프로토타입 링크"],
    notice:
      "공공 모바일 앱의 사용성 문제를 찾아 개선안을 제안하는 공모전입니다. 대학 및 대학원생이 개인 또는 3인 이하 팀으로 참가할 수 있습니다. UX 개선 제안서와 프로토타입 링크를 제출하면 되며, 우수작은 실제 서비스 개편에 반영됩니다. 대상에게는 250만 원이 수여됩니다.",
  },
  {
    id: "op-10",
    title: "기후행동 대학생 프로젝트 지원사업",
    host: "초록지구네트워크",
    source: "대외활동 커뮤니티",
    category: "대외활동",
    fields: ["사회·환경", "과학·공학"],
    majors: [],
    grades: [],
    skills: ["기획서 작성", "발표"],
    startOffset: -25,
    deadlineOffset: -2,
    prize: "팀당 프로젝트 지원금 최대 300만 원",
    eligibility: "대학(원)생 3인 이상 팀",
    schedule: "서류 → 발표 심사 → 3개월 프로젝트 수행",
    submission: ["프로젝트 계획서", "예산안"],
    notice:
      "기후위기 대응을 위한 대학생 주도 프로젝트를 지원합니다. 대학 및 대학원생 3인 이상 팀으로 지원하며, 프로젝트 계획서와 예산안을 제출합니다. 서류와 발표 심사를 거쳐 선정된 팀은 3개월간 프로젝트를 수행하며 팀당 최대 300만 원의 지원금을 받습니다.",
  },
  {
    id: "op-11",
    title: "대학원생 연구혁신 장학금",
    host: "지혜나눔학술재단",
    source: "장학금 정보센터",
    category: "장학금",
    fields: ["AI·데이터", "과학·공학", "인문·문화"],
    majors: [],
    grades: [5],
    skills: ["데이터 분석", "글쓰기"],
    startOffset: -4,
    deadlineOffset: 17,
    prize: "연구장려금 연 1,000만 원",
    eligibility: "석·박사 과정 재학생, 지도교수 추천 필수",
    schedule: "서류 → 연구계획 발표 → 최종 선정",
    submission: ["연구계획서", "지도교수 추천서", "연구실적 목록"],
    notice:
      "우수한 연구 역량을 가진 대학원생에게 연구장려금을 지원합니다. 석사 또는 박사 과정 재학생으로 지도교수의 추천을 받아야 지원할 수 있습니다. 연구계획서, 지도교수 추천서, 연구실적 목록을 제출하며 서류 심사 후 연구계획 발표를 거쳐 최종 선정합니다. 선정자에게는 연 1,000만 원의 연구장려금이 지급됩니다.",
  },
  {
    id: "op-12",
    title: "핀테크 서비스 기획 해커톤",
    host: "다온금융교육원",
    source: "해커톤 모음",
    category: "해커톤",
    fields: ["경영·경제", "IT·SW", "마케팅·기획"],
    majors: ["경영·경제", "컴퓨터·소프트웨어"],
    grades: [],
    skills: ["JavaScript", "기획서 작성", "발표"],
    startOffset: -8,
    deadlineOffset: 5,
    prize: "대상 200만 원, 멘토링 프로그램 참여",
    eligibility: "대학(원)생 2~4인 팀, 전공 무관",
    schedule: "1박 2일 오프라인 대회",
    submission: ["참가 신청서", "결과물 발표자료"],
    notice:
      "청년 세대의 금융 문제를 해결하는 핀테크 서비스를 기획하고 프로토타입을 만드는 1박 2일 해커톤입니다. 대학 및 대학원생 2~4인 팀으로 전공과 관계없이 참가할 수 있습니다. 참가 신청서를 제출하고 대회 당일 결과물 발표자료를 제출합니다. 대상 팀에는 200만 원과 함께 현직자 멘토링 프로그램 참여 기회가 주어집니다.",
  },
  {
    id: "op-13",
    title: "과학 커뮤니케이터 영상 공모전",
    host: "별빛과학문화원",
    source: "공모전 포털",
    category: "공모전",
    fields: ["과학·공학", "인문·문화"],
    majors: ["자연과학", "미디어·커뮤니케이션"],
    grades: [],
    skills: ["영상 편집", "발표"],
    startOffset: -6,
    deadlineOffset: 12,
    prize: "대상 150만 원, 과학관 상영",
    eligibility: "대학생 및 대학원생, 개인 또는 2인 팀",
    schedule: "접수 → 심사 → 시상 및 상영회",
    submission: ["3분 이내 영상", "영상 기획 의도서"],
    notice:
      "어려운 과학 개념을 쉽게 풀어내는 3분 이내의 영상을 공모합니다. 대학생 및 대학원생이 개인 또는 2인 팀으로 참가할 수 있으며, 영상과 기획 의도서를 제출합니다. 대상에게는 150만 원이 수여되며 수상작은 과학관에서 상영됩니다.",
  },
  {
    id: "op-14",
    title: "새내기 성장지원 장학금",
    host: "한마음교육나눔",
    source: "장학금 정보센터",
    category: "장학금",
    fields: ["인문·문화", "사회·환경", "경영·경제"],
    majors: [],
    grades: [1],
    skills: ["글쓰기"],
    startOffset: -9,
    deadlineOffset: 8,
    prize: "생활지원금 200만 원",
    eligibility: "대학 1학년 재학생, 전공 무관",
    schedule: "서류 심사 → 최종 발표",
    submission: ["신청서", "자기소개서"],
    notice:
      "대학에 처음 입학한 신입생의 학업 적응을 돕기 위해 생활지원금을 지급합니다. 대학 1학년 재학생이라면 전공과 관계없이 지원할 수 있습니다. 신청서와 자기소개서를 제출하면 서류 심사 후 최종 선발 결과를 안내합니다. 선발된 학생에게는 200만 원의 생활지원금이 지급됩니다.",
  },
];

export const gradeLabel = (g: number) => (g === 5 ? "대학원생" : `${g}학년`);

export function dday(offset: number) {
  if (offset < 0) return "마감";
  if (offset === 0) return "D-Day";
  return `D-${offset}`;
}

export function dateFromOffset(offset: number) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + offset);
  return `${d.getMonth() + 1}.${String(d.getDate()).padStart(2, "0")}`;
}
