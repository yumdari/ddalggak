// 모델 제공자와 무관한 프롬프트·출력 스키마

export const ANALYSIS_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["title", "overview", "sections", "concepts", "flashcards"],
  properties: {
    title: { type: "string" },
    overview: { type: "string" },
    sections: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["heading", "points"],
        properties: {
          heading: { type: "string" },
          points: { type: "array", items: { type: "string" } },
        },
      },
    },
    concepts: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["term", "definition"],
        properties: { term: { type: "string" }, definition: { type: "string" } },
      },
    },
    flashcards: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["front", "back"],
        properties: { front: { type: "string" }, back: { type: "string" } },
      },
    },
  },
} as const;

export const ANALYZE_PROMPT = `첨부된 강의자료 PDF를 학생이 시험 대비에 쓸 수 있게 정리해 주세요. 모든 내용은 자료에 있는 것만 바탕으로 한국어로 쓰세요.

- title: 자료 제목 (한 줄)
- overview: 전체 내용을 2~3문장으로 요약
- sections: 자료의 흐름에 따른 4~8개 섹션. 각 섹션은 heading과 핵심 문장 2~5개(points)
- concepts: 시험에 나올 만한 핵심 개념 6~12개 (term, definition)
- flashcards: 암기용 카드 8~12개 (front는 질문이나 용어, back은 답)`;

export const QUIZ_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["quiz"],
  properties: {
    quiz: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["question", "choices", "answerIndex", "explanation", "hint"],
        properties: {
          question: { type: "string" },
          choices: { type: "array", items: { type: "string" } },
          answerIndex: { type: "integer" },
          explanation: { type: "string" },
          hint: { type: "string" },
        },
      },
    },
  },
} as const;

export const MIN_QUIZ = 3;
export const MAX_QUIZ = 10;

export function quizPrompt(count: number) {
  return `첨부된 강의자료 PDF의 내용으로 시험 대비용 객관식 퀴즈를 정확히 ${count}문제 만들어 주세요. 자료에 있는 내용만 바탕으로 한국어로 쓰세요.

- question: 문제
- choices: 보기 정확히 4개
- answerIndex: 정답 보기의 위치 (0부터 시작). 정답 위치가 한쪽으로 몰리지 않게 섞을 것
- explanation: 왜 그것이 정답인지 해설
- hint: 정답을 직접 알려주지 않으면서 떠올릴 단서가 되는 짧은 힌트 한 문장`;
}

export const TUTOR_SYSTEM =
  "당신은 대학생의 전공 공부를 돕는 AI 튜터입니다. 첨부된 강의자료를 근거로 한국어로 친절하고 간결하게 답하세요. 자료에 없는 내용은 없다고 말한 뒤, 알고 있는 일반 지식임을 밝히고 보충하세요.";
