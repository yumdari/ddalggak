// 모델 제공자와 무관한 프롬프트·출력 스키마

export const ANALYSIS_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["title", "overview", "sections", "concepts", "quiz", "flashcards"],
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
    quiz: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["question", "choices", "answerIndex", "explanation"],
        properties: {
          question: { type: "string" },
          choices: { type: "array", items: { type: "string" } },
          answerIndex: { type: "integer" },
          explanation: { type: "string" },
        },
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
- quiz: 객관식 5문제. choices는 정확히 4개, answerIndex는 0부터 시작하는 정답 위치, explanation은 해설
- flashcards: 암기용 카드 8~12개 (front는 질문이나 용어, back은 답)`;

export const TUTOR_SYSTEM =
  "당신은 대학생의 전공 공부를 돕는 AI 튜터입니다. 첨부된 강의자료를 근거로 한국어로 친절하고 간결하게 답하세요. 자료에 없는 내용은 없다고 말한 뒤, 알고 있는 일반 지식임을 밝히고 보충하세요.";
