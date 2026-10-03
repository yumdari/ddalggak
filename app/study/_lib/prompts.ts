// 모델 제공자와 무관한 프롬프트·출력 스키마

export type JsonTask = {
  prompt: string;
  schema: object;
  maxTokens: number;
};

const str = { type: "string" } as const;

function list(required: string[], properties: Record<string, object>) {
  return {
    type: "array",
    items: { type: "object", additionalProperties: false, required, properties },
  } as const;
}

// ── 요약 ──────────────────────────────────────────────

const ANALYSIS_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["title", "overview", "sections"],
  properties: {
    title: str,
    overview: str,
    sections: list(["heading", "points"], {
      heading: str,
      points: list(["text", "pages"], {
        text: str,
        pages: { type: "array", items: { type: "integer" } },
      }),
    }),
  },
} as const;

const ANALYZE_PROMPT = `첨부된 강의자료 PDF를 학생이 시험 대비에 쓸 수 있게 요약해 주세요. 모든 내용은 자료에 있는 것만 바탕으로 한국어로 쓰세요.

- title: 자료 제목 (한 줄)
- overview: 전체 내용을 2~3문장으로 요약
- sections: 자료의 흐름에 따른 4~8개 섹션. 각 섹션은 heading과 핵심 항목 2~5개(points)
- points[].text: 핵심 내용 한두 문장. 중요한 용어는 **용어**처럼 별표 두 개로 감싸 강조
- points[].pages: 그 내용이 나온 PDF 페이지 번호들. 첫 페이지를 1로 세는 순번이며 슬라이드에 적힌 번호가 아니다. 모르면 빈 배열`;

export const analyzeTask: JsonTask = {
  prompt: ANALYZE_PROMPT,
  schema: ANALYSIS_SCHEMA,
  maxTokens: 12000,
};

// ── 핵심 개념 ─────────────────────────────────────────

export const conceptsTask: JsonTask = {
  prompt: `첨부된 강의자료 PDF에서 시험에 나올 만한 핵심 개념을 6~12개 뽑아 주세요. 자료에 있는 내용만 바탕으로 한국어로 쓰세요.

- term: 용어
- definition: 자료에 나온 정의를 한두 문장으로`,
  schema: {
    type: "object",
    additionalProperties: false,
    required: ["concepts"],
    properties: { concepts: list(["term", "definition"], { term: str, definition: str }) },
  },
  maxTokens: 6000,
};

// ── 플래시카드 ────────────────────────────────────────

export const flashcardsTask: JsonTask = {
  prompt: `첨부된 강의자료 PDF로 암기용 플래시카드를 8~12개 만들어 주세요. 자료에 있는 내용만 바탕으로 한국어로 쓰세요.

- front: 질문이나 용어
- back: 간결한 답`,
  schema: {
    type: "object",
    additionalProperties: false,
    required: ["flashcards"],
    properties: { flashcards: list(["front", "back"], { front: str, back: str }) },
  },
  maxTokens: 6000,
};

// ── 퀴즈 ──────────────────────────────────────────────

export const MIN_QUIZ = 3;
export const MAX_QUIZ = 10;

export function quizTask(count: number): JsonTask {
  return {
    prompt: `첨부된 강의자료 PDF의 내용으로 시험 대비용 객관식 퀴즈를 정확히 ${count}문제 만들어 주세요. 자료에 있는 내용만 바탕으로 한국어로 쓰세요.

- question: 문제
- choices: 보기 정확히 4개
- answerIndex: 정답 보기의 위치 (0부터 시작). 정답 위치가 한쪽으로 몰리지 않게 섞을 것
- explanation: 왜 그것이 정답인지 해설
- hint: 정답을 직접 알려주지 않으면서 떠올릴 단서가 되는 짧은 힌트 한 문장`,
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["quiz"],
      properties: {
        quiz: list(["question", "choices", "answerIndex", "explanation", "hint"], {
          question: str,
          choices: { type: "array", items: str },
          answerIndex: { type: "integer" },
          explanation: str,
          hint: str,
        }),
      },
    },
    maxTokens: 8000,
  };
}

// ── AI 튜터 ───────────────────────────────────────────

export const TUTOR_SYSTEM =
  "당신은 대학생의 전공 공부를 돕는 AI 튜터입니다. 첨부된 강의자료를 근거로 한국어로 친절하고 간결하게 답하세요. 자료에 없는 내용은 없다고 말한 뒤, 알고 있는 일반 지식임을 밝히고 보충하세요. 답변은 마크다운(굵게, 목록, 표)으로 읽기 쉽게 쓰고, 수식은 LaTeX로 인라인은 $...$, 별도 줄은 $$...$$로 쓰세요.";
