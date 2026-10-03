import { ApiError, GoogleGenAI } from "@google/genai";
import { MissingKeyError, UnusableOutputError } from "../errors";
import { ANALYSIS_SCHEMA, ANALYZE_PROMPT, TUTOR_SYSTEM } from "../prompts";
import type { Analysis, ChatMessage } from "../types";

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

// 503(과부하)·429(한도)는 잠깐 뒤 다시 시도하면 풀리는 경우가 많다
async function generate(params: Parameters<GoogleGenAI["models"]["generateContent"]>[0]) {
  const delays = [2000, 5000, 10000];
  for (let attempt = 0; ; attempt++) {
    try {
      return await getClient().models.generateContent(params);
    } catch (e) {
      const retryable = e instanceof ApiError && (e.status === 503 || e.status === 429);
      if (!retryable || attempt >= delays.length) throw e;
      await new Promise((r) => setTimeout(r, delays[attempt]));
    }
  }
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
