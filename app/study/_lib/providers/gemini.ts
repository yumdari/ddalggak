import { ApiError, GoogleGenAI, ThinkingLevel } from "@google/genai";
import { MissingKeyError, UnusableOutputError } from "../errors";
import { tutorSystem, type JsonTask, type TutorMode } from "../prompts";
import type { ChatMessage } from "../types";

// 사용 가능한 모델명과 무료 한도는 AI Studio에서 확인하고 GEMINI_MODEL로 바꾼다
const MODEL = process.env.GEMINI_MODEL ?? "gemini-3.5-flash";

// 기본 모델이 붐비면(503)·한도에 걸리면(429) 대체 모델로 넘어간다. 쉼표로 여러 개 지정 가능
const FALLBACK_MODELS = (process.env.GEMINI_FALLBACK_MODELS ?? "gemini-3.8-flash,gemini-3.6-flash,gemini-3.1-flash-lite")
  .split(",")
  .map((m) => m.trim())
  .filter(Boolean);

// 키는 쉼표로 여러 개 지정할 수 있다 (GEMINI_API_KEYS). 한 키의 한도가 차거나 막히면 다음 키로 넘어간다.
// 한도는 구글 프로젝트 단위라, 서로 다른 프로젝트에서 만든 키여야 한도가 따로 계산된다.
const KEYS = (process.env.GEMINI_API_KEYS ?? process.env.GEMINI_API_KEY ?? "")
  .split(",")
  .map((k) => k.trim())
  .filter(Boolean);

const clients: (GoogleGenAI | undefined)[] = [];
function getClient(index: number) {
  return (clients[index] ??= new GoogleGenAI({ apiKey: KEYS[index] }));
}

function pdfPart(base64: string) {
  return { inlineData: { mimeType: "application/pdf", data: base64 } };
}

// 무료 티어의 하루 요청 한도(모델·프로젝트당)를 다 쓴 경우
export function isDailyQuota(e: unknown) {
  return e instanceof ApiError && e.status === 429 && /PerDay/i.test(e.message);
}

// 하루 한도가 찬 (모델, 키) 조합은 한동안 건너뛴다. 서버 인스턴스마다 따로 기억한다
const QUOTA_RECHECK_MS = 30 * 60 * 1000;
const exhausted = new Map<string, number>();
const slot = (model: string, key: number) => `${model}#${key}`;

// 모델 순서(기본 → 대체)대로, 모델마다 키 순서대로 시도한다.
// 한 바퀴를 돌고도 일시 오류(503·429)만 있었다면 잠깐 쉬고 한 바퀴 더 돈다. 404는 그 모델을 건너뛴다.
async function generate(params: Parameters<GoogleGenAI["models"]["generateContent"]>[0]) {
  if (KEYS.length === 0) {
    throw new MissingKeyError("서버에 GEMINI_API_KEYS(또는 GEMINI_API_KEY)가 설정되지 않았어요.");
  }

  let lastError: unknown;
  for (let pass = 0; pass < 2; pass++) {
    let retryable = false;
    for (const model of [MODEL, ...FALLBACK_MODELS]) {
      for (let key = 0; key < KEYS.length; key++) {
        if ((exhausted.get(slot(model, key)) ?? 0) > Date.now()) continue;
        try {
          const response = await getClient(key).models.generateContent({ ...params, model });
          if (model !== MODEL || key !== 0) {
            console.warn(`[ai] served by model=${model} key=#${key + 1}`);
          }
          return response;
        } catch (e) {
          lastError = e;
          if (!(e instanceof ApiError)) throw e;
          if (e.status === 404) break; // 이 모델은 없다 → 다음 모델
          if (isDailyQuota(e)) {
            exhausted.set(slot(model, key), Date.now() + QUOTA_RECHECK_MS);
            continue;
          }
          if (e.status !== 503 && e.status !== 429) throw e;
          retryable = true;
        }
      }
    }
    if (!retryable) break;
    await new Promise((r) => setTimeout(r, 1500));
  }
  throw lastError;
}

// PDF와 작업 지시를 보내 스키마에 맞는 JSON을 받는다
export async function json(pdfBase64: string, task: JsonTask): Promise<unknown> {
  const response = await generate({
    model: MODEL,
    contents: [{ role: "user", parts: [pdfPart(pdfBase64), { text: task.prompt }] }],
    config: {
      responseMimeType: "application/json",
      responseJsonSchema: task.schema,
      maxOutputTokens: task.maxTokens,
      thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
    },
  });

  const text = response.text;
  if (!text || response.candidates?.[0]?.finishReason === "MAX_TOKENS") {
    throw new UnusableOutputError(String(response.candidates?.[0]?.finishReason));
  }
  return JSON.parse(text);
}

export async function tutor(
  pdfBase64: string,
  messages: ChatMessage[],
  mode: TutorMode,
): Promise<string> {
  // PDF는 첫 질문에만 붙이고, 이후 대화는 텍스트만 이어 붙인다
  const [first, ...rest] = messages;
  const response = await generate({
    model: MODEL,
    contents: [
      { role: "user", parts: [pdfPart(pdfBase64), { text: first.content }] },
      ...rest.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      })),
    ],
    config: {
      systemInstruction: tutorSystem(mode),
      maxOutputTokens: 4000,
      thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
    },
  });

  if (!response.text) throw new UnusableOutputError("empty");
  return response.text;
}
