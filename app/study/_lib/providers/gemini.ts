import { ApiError, GoogleGenAI } from "@google/genai";
import { MissingKeyError, UnusableOutputError } from "../errors";
import { ANALYSIS_SCHEMA, ANALYZE_PROMPT, QUIZ_SCHEMA, TUTOR_SYSTEM, quizPrompt } from "../prompts";
import type { Analysis, ChatMessage, QuizItem } from "../types";

// 사용 가능한 모델명과 무료 한도는 AI Studio에서 확인하고 GEMINI_MODEL로 바꾼다
const MODEL = process.env.GEMINI_MODEL ?? "gemini-3.8-flash";

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

// 기본 모델이 붐비면(503)·한도에 걸리면(429) 대체 모델로 넘어간다. 쉼표로 여러 개 지정 가능
const FALLBACK_MODELS = (process.env.GEMINI_FALLBACK_MODELS ?? "gemini-3.6-flash,gemini-3.1-flash-lite")
  .split(",")
  .map((m) => m.trim())
  .filter(Boolean);

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
        if (attempt === 0) await new Promise((r) => setTimeout(r, 1500));
      }
    }
  }
  throw lastError;
}

export async function analyze(pdfBase64: string): Promise<Analysis> {
  const response = await generate({
    model: MODEL,
    contents: [{ role: "user", parts: [pdfPart(pdfBase64), { text: ANALYZE_PROMPT }] }],
    config: {
      responseMimeType: "application/json",
      responseJsonSchema: ANALYSIS_SCHEMA,
      maxOutputTokens: 16000,
    },
  });

  const text = response.text;
  if (!text || response.candidates?.[0]?.finishReason === "MAX_TOKENS") {
    throw new UnusableOutputError(String(response.candidates?.[0]?.finishReason));
  }
  return JSON.parse(text) as Analysis;
}

export async function quiz(pdfBase64: string, count: number): Promise<QuizItem[]> {
  const response = await generate({
    model: MODEL,
    contents: [{ role: "user", parts: [pdfPart(pdfBase64), { text: quizPrompt(count) }] }],
    config: {
      responseMimeType: "application/json",
      responseJsonSchema: QUIZ_SCHEMA,
      maxOutputTokens: 8000,
    },
  });

  const text = response.text;
  if (!text || response.candidates?.[0]?.finishReason === "MAX_TOKENS") {
    throw new UnusableOutputError(String(response.candidates?.[0]?.finishReason));
  }
  return (JSON.parse(text) as { quiz: QuizItem[] }).quiz;
}

export async function tutor(pdfBase64: string, messages: ChatMessage[]): Promise<string> {
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
    config: { systemInstruction: TUTOR_SYSTEM, maxOutputTokens: 4000 },
  });

  if (!response.text) throw new UnusableOutputError("empty");
  return response.text;
}
