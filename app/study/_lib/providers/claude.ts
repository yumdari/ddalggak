import Anthropic from "@anthropic-ai/sdk";
import { MissingKeyError, UnusableOutputError } from "../errors";
import { TUTOR_SYSTEM, type JsonTask } from "../prompts";
import type { ChatMessage } from "../types";

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

// PDF와 작업 지시를 보내 스키마에 맞는 JSON을 받는다
export async function json(pdfBase64: string, task: JsonTask): Promise<unknown> {
  const response = await getClient().messages.create({
    model: MODEL,
    max_tokens: task.maxTokens,
    output_config: {
      effort: "low",
      format: { type: "json_schema", schema: task.schema as Record<string, unknown> },
    },
    messages: [
      {
        role: "user",
        content: [pdfBlock(pdfBase64), { type: "text", text: task.prompt }],
      },
    ],
  });

  if (response.stop_reason === "refusal" || response.stop_reason === "max_tokens") {
    throw new UnusableOutputError(response.stop_reason);
  }
  return JSON.parse(textOf(response.content));
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
