import { MAX_PDF_BYTES, MODEL, TUTOR_SYSTEM, errorResponse, getClient, pdfBlock, textOf } from "@/lib/ai";
import type { ChatMessage } from "@/lib/types";

export const maxDuration = 60;

export async function POST(req: Request) {
  const { pdfBase64, messages } = (await req.json()) as {
    pdfBase64?: string;
    messages?: ChatMessage[];
  };

  if (!pdfBase64 || !messages?.length || messages[0].role !== "user") {
    return Response.json({ error: "잘못된 요청이에요." }, { status: 400 });
  }
  if (pdfBase64.length > MAX_PDF_BYTES * 1.4) {
    return Response.json({ error: "4MB 이하의 PDF만 사용할 수 있어요." }, { status: 413 });
  }

  if (process.env.MOCK_AI === "1") {
    await new Promise((r) => setTimeout(r, 800));
    return Response.json({ reply: "(샘플 답변) MOCK_AI 모드에서는 실제 AI가 호출되지 않아요." });
  }

  // PDF는 첫 질문에만 붙이고, 이후 대화는 텍스트만 이어 붙인다
  const [first, ...rest] = messages;
  const apiMessages = [
    {
      role: "user" as const,
      content: [pdfBlock(pdfBase64), { type: "text" as const, text: first.content }],
    },
    ...rest.map((m) => ({ role: m.role, content: m.content })),
  ];

  try {
    const response = await getClient().messages.create({
      model: MODEL,
      max_tokens: 4000,
      output_config: { effort: "low" },
      system: TUTOR_SYSTEM,
      messages: apiMessages,
    });
    return Response.json({ reply: textOf(response.content) });
  } catch (e) {
    return errorResponse(e);
  }
}
