// 상단 메뉴 구성. 메뉴를 추가하거나 경로가 바뀌면 여기만 고친다.

export type NavItem = {
  label: string;
  href: string;
  children: { label: string; href: string }[];
};

export const nav: NavItem[] = [
  {
    label: "딸깍 소개",
    href: "/#about",
    children: [
      { label: "비전", href: "/#about" },
      { label: "해결하는 문제", href: "/#problem" },
      { label: "차별점", href: "/#difference" },
      { label: "책임 있는 AI", href: "/#responsible" },
    ],
  },
  {
    label: "기회 정보",
    href: "/opportunities",
    children: [
      { label: "공모전 통합 검색", href: "/opportunities?tab=search" },
      { label: "AI 맞춤 추천", href: "/opportunities?tab=recommend" },
      { label: "관심 공모전", href: "/opportunities?tab=saved" },
    ],
  },
  {
    label: "수강신청",
    href: "/course-plan",
    children: [
      { label: "학사 일정 알림", href: "/course-plan?tab=schedule" },
      { label: "플랜 A·B·C 만들기", href: "/course-plan?tab=plan" },
    ],
  },
  {
    label: "학습 지원",
    href: "/study",
    children: [
      { label: "서비스 소개", href: "/study" },
      { label: "PDF 요약·퀴즈 시작", href: "/study/workspace" },
    ],
  },
];
