import type { Analysis, Concept, Flashcard, QuizItem } from "./types";

// MOCK_AI=1 일 때만 사용하는 화면 확인용 샘플 (API 키 없이 UI 개발할 때)
export const MOCK_ANALYSIS: Analysis = {
  title: "샘플: 글로벌 브랜드 전략",
  overview:
    "다국적 기업이 브랜드 일관성과 현지 적응 사이에서 균형을 잡는 전략을 다룬 강의자료입니다.",
  sections: [
    {
      heading: "글로벌 표준화와 현지화",
      points: [
        { text: "**표준화**는 비용 절감과 일관된 이미지를 준다.", pages: [1, 2] },
        { text: "**현지화**는 시장별 요구에 맞춘 대응을 가능하게 한다.", pages: [2] },
      ],
    },
    {
      heading: "글로컬라이제이션",
      points: [
        { text: "핵심 정체성은 유지하고 메시지와 제품은 현지에 맞춘다.", pages: [3] },
      ],
    },
  ],
};

export const MOCK_CONCEPTS: Concept[] = [
  { term: "글로컬라이제이션", definition: "Globalization과 Localization을 결합한 전략." },
  { term: "브랜드 일관성", definition: "여러 시장에서 같은 브랜드 경험을 제공하는 것." },
];

export const MOCK_FLASHCARDS: Flashcard[] = [
  { front: "글로컬라이제이션이란?", back: "글로벌 통합과 현지 적응을 함께 추구하는 전략" },
];

const MOCK_QUIZ_ITEM: QuizItem = {
  question: "글로컬라이제이션 전략의 핵심은 무엇인가?",
  choices: [
    "모든 시장에서 완전히 같은 제품 판매",
    "핵심 정체성 유지와 현지 적응의 균형",
    "현지 시장 철수",
    "가격 인하 경쟁",
  ],
  answerIndex: 1,
  explanation: "글로컬라이제이션은 표준화와 현지화를 동시에 추구합니다.",
  hint: "'글로벌'과 '로컬'을 합친 말이에요.",
};

export function mockQuiz(count: number): QuizItem[] {
  return Array.from({ length: count }, (_, i) => ({
    ...MOCK_QUIZ_ITEM,
    question: `(${i + 1}) ${MOCK_QUIZ_ITEM.question}`,
  }));
}
