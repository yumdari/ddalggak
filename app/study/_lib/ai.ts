import { provider } from "./config";
import { MOCK_ANALYSIS, MOCK_CONCEPTS, MOCK_FLASHCARDS, mockQuiz } from "./mock";
import {
  analyzeTask,
  conceptsTask,
  flashcardsTask,
  quizTask,
  type JsonTask,
  type TutorMode,
} from "./prompts";
import * as claude from "./providers/claude";
import * as gemini from "./providers/gemini";
import type { Analysis, ChatMessage, Concept, Flashcard, QuizItem } from "./types";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const mock = process.env.MOCK_AI === "1";

function run(pdfBase64: string, task: JsonTask) {
  return provider() === "claude" ? claude.json(pdfBase64, task) : gemini.json(pdfBase64, task);
}

export async function analyzePdf(pdfBase64: string): Promise<Analysis> {
  if (mock) {
    await sleep(1500);
    return MOCK_ANALYSIS;
  }
  return (await run(pdfBase64, analyzeTask)) as Analysis;
}

export async function makeConcepts(pdfBase64: string): Promise<Concept[]> {
  if (mock) {
    await sleep(1000);
    return MOCK_CONCEPTS;
  }
  return ((await run(pdfBase64, conceptsTask)) as { concepts: Concept[] }).concepts;
}

export async function makeFlashcards(pdfBase64: string): Promise<Flashcard[]> {
  if (mock) {
    await sleep(1000);
    return MOCK_FLASHCARDS;
  }
  return ((await run(pdfBase64, flashcardsTask)) as { flashcards: Flashcard[] }).flashcards;
}

export async function makeQuiz(pdfBase64: string, count: number): Promise<QuizItem[]> {
  if (mock) {
    await sleep(1200);
    return mockQuiz(count);
  }
  return ((await run(pdfBase64, quizTask(count))) as { quiz: QuizItem[] }).quiz;
}

export async function askTutor(
  pdfBase64: string,
  messages: ChatMessage[],
  mode: TutorMode,
): Promise<string> {
  if (mock) {
    await sleep(800);
    return "(샘플 답변) MOCK_AI 모드에서는 실제 AI가 호출되지 않아요.";
  }
  return provider() === "claude"
    ? claude.tutor(pdfBase64, messages, mode)
    : gemini.tutor(pdfBase64, messages, mode);
}
