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

let client: GoogleGenAI | null = null;
function getClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new MissingKeyError("서버에 GEMINI_API_KEY가 설정되지 않았어요.");
  }
  client ??= new GoogleGenAI({ apiKey });
  return client;
}

function pdfPart(base64: string) {
  return { inlineData: { mimeType: "application/pdf", data: base64 } };
}

// 무료 티어의 하루 요청 한도(모델당)를 다 쓴 경우
export function isDailyQuota(e: unknown) {
  return e instanceof ApiError && e.status === 429 && /PerDay/i.test(e.message);
}

// 모델마다 한 번씩 재시도하고, 그래도 안 되면 다음 모델로 간다 (404는 바로 다음 모델)
async function generate(params: Parameters<GoogleGenAI["models"]["generateContent"]>[0]) {
  let lastError: unknown;
  for (const model of [MODEL, ...FALLBACK_MODELS]) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await getClient().models.generateContent({ ...params, model });
        if (model !== MODEL) console.warn("[ai] fallback model used:", model);
        return response;
      } catch (e) {
        lastError = e;
        if (!(e instanceof ApiError)) throw e;
        if (e.status === 404) break;
        if (e.status !== 503 && e.status !== 429) throw e;
        if (isDailyQuota(e)) break; // 하루 한도는 기다려도 안 풀리니 바로 다음 모델로
        if (attempt === 0) await new Promise((r) => setTimeout(r, 1500));
      }
    }
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
