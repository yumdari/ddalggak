import Anthropic from "@anthropic-ai/sdk";
import { MissingKeyError, UnusableOutputError } from "../errors";
import { ANALYSIS_SCHEMA, ANALYZE_PROMPT, QUIZ_SCHEMA, TUTOR_SYSTEM, quizPrompt } from "../prompts";
import type { Analysis, ChatMessage, QuizItem } from "../types";

const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-opus-5-5";

let client: Anthropic | null = null;
function getClient() {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new MissingKeyError("서버에 ANTHROPIC_API_KEY가 설정되지 않았어요.");
  }
  client ??= new Anthropic();
  return client;
}

function pdfBlock(base64: string) {
  return {
    type: "document" as const,
    source: { type: "base64" as const, media_type: "application/pdf" as const, data: base64 },
  };
}

function textOf(content: Anthropic.ContentBlock[]) {
  return content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("\n");
}

export async function analyze(pdfBase64: string): Promise<Analysis> {
  const response = await getClient().messages.create({
    model: MODEL,
    max_tokens: 16000,
    output_config: {
      effort: "low",
      format: { type: "json_schema", schema: ANALYSIS_SCHEMA },
    },
    messages: [
      {
        role: "user",
        content: [pdfBlock(pdfBase64), { type: "text", text: ANALYZE_PROMPT }],
      },
    ],
  });

  if (response.stop_reason === "refusal" || response.stop_reason === "max_tokens") {
    throw new UnusableOutputError(response.stop_reason);
  }
  return JSON.parse(textOf(response.content)) as Analysis;
}

export async function quiz(pdfBase64: string, count: number): Promise<QuizItem[]> {
  const response = await getClient().messages.create({
    model: MODEL,
    max_tokens: 8000,
    output_config: {
      effort: "low",
      format: { type: "json_schema", schema: QUIZ_SCHEMA },
    },
    messages: [
      {
        role: "user",
        content: [pdfBlock(pdfBase64), { type: "text", text: quizPrompt(count) }],
      },
    ],
  });

  if (response.stop_reason === "refusal" || response.stop_reason === "max_tokens") {
    throw new UnusableOutputError(response.stop_reason);
  }
  return (JSON.parse(textOf(response.content)) as { quiz: QuizItem[] }).quiz;
}

export async function tutor(pdfBase64: string, messages: ChatMessage[]): Promise<string> {
  // PDF는 첫 질문에만 붙이고, 이후 대화는 텍스트만 이어 붙인다
  const [first, ...rest] = messages;
  const response = await getClient().messages.create({
    model: MODEL,
    max_tokens: 4000,
    output_config: { effort: "low" },
    system: TUTOR_SYSTEM,
    messages: [
      {
        role: "user",
        content: [pdfBlock(pdfBase64), { type: "text", text: first.content }],
      },
      ...rest.map((m) => ({ role: m.role, content: m.content })),
    ],
  });
  return textOf(response.content);
}
