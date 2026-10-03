import { ApiError, ThinkingLevel, type GoogleGenAI } from "@google/genai";
import { geminiKeys, isDailyQuota, withGeminiKey } from "@/lib/gemini";
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

function pdfPart(base64: string) {
  return { inlineData: { mimeType: "application/pdf", data: base64 } };
}

// 모델 순서(기본 → 대체)대로 시도한다. 키는 공통 모듈(@/lib/gemini)이 돌려 쓰고, 키 때문에 실패하면 다음 키로 넘긴다.
// 한 모델의 키가 모두 하루 한도이거나 없는 모델(404)이면 다음 모델로 가고,
// 한 바퀴를 돌고도 일시 오류(503·429)만 있었다면 잠깐 쉬고 한 바퀴 더 돈다.
async function generate(params: Parameters<GoogleGenAI["models"]["generateContent"]>[0]) {
  if (geminiKeys().length === 0) {
    throw new MissingKeyError("서버에 GEMINI_API_KEYS(또는 GEMINI_API_KEY)가 설정되지 않았어요.");
  }

  let lastError: unknown;
  for (let pass = 0; pass < 2; pass++) {
    let retryable = false;
    for (const model of [MODEL, ...FALLBACK_MODELS]) {
      try {
        const response = await withGeminiKey(model, (client) =>
          client.models.generateContent({ ...params, model }),
        );
        if (model !== MODEL) console.warn(`[ai] served by fallback model=${model}`);
        return response;
      } catch (e) {
        lastError = e;
        if (!(e instanceof ApiError)) throw e;
        if (e.status === 404 || isDailyQuota(e)) continue; // 이 모델은 못 쓴다 → 다음 모델
        if (e.status !== 503 && e.status !== 429) throw e;
        retryable = true;
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
