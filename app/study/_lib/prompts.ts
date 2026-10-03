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
    sections: list(["heading", "points", "takeaway", "easy"], {
      heading: str,
      points: list(["text", "pages"], {
        text: str,
        pages: { type: "array", items: { type: "integer" } },
      }),
      takeaway: str,
      easy: str,
    }),
  },
} as const;

const ANALYZE_PROMPT = `첨부된 강의자료 PDF를 학생이 시험 대비에 쓸 수 있도록 꼼꼼하게 요약해 주세요. 모든 내용은 자료에 있는 것만 바탕으로 한국어로 쓰고, 자료에 나온 내용을 빠뜨리거나 얼버무리지 마세요.

[전체 구성]
- title: 자료 제목 (한 줄)
- overview: 이 강의가 무엇을 다루고 핵심 주장이 무엇인지 2~3문장
- sections: 강의 흐름에 따른 4~6개 섹션 (자료가 길수록 많이). heading은 짧은 주제어. 표지·목차·복습 슬라이드는 짧게 다루고 본론을 자세히 다룬다. 자료의 마지막 슬라이드까지 빠짐없이 훑어서 모든 핵심 내용이 어느 섹션엔가 들어가야 한다

[각 섹션]
- points: 핵심 항목 5~8개. 각 항목(text)은 최소 2~3문장, 150자 이상으로 충분히 자세히 쓴다. 한 줄짜리 항목은 안 된다.
  · 자료에 나온 구체적인 예시, 수치, 데이터셋 이름(예: Iris, Boston Housing), 계산 예, 그림이 보여주는 내용, 정의, 조건을 그대로 포함한다. 예시가 있는 슬라이드는 반드시 그 예시를 항목으로 만든다.
  · 중요한 용어는 **용어**처럼 별표 두 개로 감싼다.
  · 수식은 LaTeX로 쓴다. 문장 속 수식은 $...$, 독립된 수식은 줄을 바꿔 $$...$$ 로 쓴다. 수식을 말로 풀어쓰지 말고 반드시 수식으로 적는다.
  · 순서가 있는 절차나 분류는 text 안에서 "1. ", "2. " 번호 목록으로 쓸 수 있다.
  · pages: 그 항목의 내용이 나온 PDF 페이지 번호들. 첫 페이지를 1로 세는 순번이며 슬라이드에 적힌 번호가 아니다. 모르면 빈 배열
- takeaway: 이 섹션에서 꼭 기억할 핵심을 한 문장으로 (**굵게** 가능)
- easy: 같은 내용을 처음 배우는 사람에게 설명하듯 풀어 쓴 쉬운 설명. 일상의 비유와 이 섹션의 구체적인 예를 들어 2~3문단, 300자 이상, "~해요" 말투. 가장 중요한 한 문장은 **굵게**. 필요하면 $...$ 수식도 쓴다.

[JSON 주의] 문자열 안에서 LaTeX의 백슬래시는 JSON 규칙에 따라 반드시 두 번 쓴다 (예: "\\\\theta", "\\\\frac{a}{b}", "\\\\begin{bmatrix}").`;

export const analyzeTask: JsonTask = {
  prompt: ANALYZE_PROMPT,
  schema: ANALYSIS_SCHEMA,
  maxTokens: 24000,
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
