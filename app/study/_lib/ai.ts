import { provider } from "./config";
import { MOCK_ANALYSIS, mockQuiz } from "./mock";
import * as claude from "./providers/claude";
import * as gemini from "./providers/gemini";
import type { Analysis, ChatMessage, QuizItem } from "./types";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const mock = process.env.MOCK_AI === "1";

export async function analyzePdf(pdfBase64: string): Promise<Analysis> {
  if (mock) {
    await sleep(1500);
    return MOCK_ANALYSIS;
  }
  return provider() === "claude" ? claude.analyze(pdfBase64) : gemini.analyze(pdfBase64);
}

export async function makeQuiz(pdfBase64: string, count: number): Promise<QuizItem[]> {
  if (mock) {
    await sleep(1200);
    return mockQuiz(count);
  }
  return provider() === "claude" ? claude.quiz(pdfBase64, count) : gemini.quiz(pdfBase64, count);
}

export async function askTutor(pdfBase64: string, messages: ChatMessage[]): Promise<string> {
  if (mock) {
    await sleep(800);
    return "(샘플 답변) MOCK_AI 모드에서는 실제 AI가 호출되지 않아요.";
  }
  return provider() === "claude"
    ? claude.tutor(pdfBase64, messages)
    : gemini.tutor(pdfBase64, messages);
}
