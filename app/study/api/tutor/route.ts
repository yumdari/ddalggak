import { askTutor } from "@/app/study/_lib/ai";
import { MAX_PDF_BYTES } from "@/app/study/_lib/config";
import { errorResponse } from "@/app/study/_lib/errors";
import type { ChatMessage } from "@/app/study/_lib/types";

export const maxDuration = 60;

export async function POST(req: Request) {
  const { pdfBase64, messages, mode } = (await req.json()) as {
    pdfBase64?: string;
    messages?: ChatMessage[];
    mode?: string;
  };

  if (!pdfBase64 || !messages?.length || messages[0].role !== "user") {
    return Response.json({ error: "잘못된 요청이에요." }, { status: 400 });
  }
  if (pdfBase64.length > MAX_PDF_BYTES * 1.4) {
    return Response.json({ error: "4MB 이하의 PDF만 사용할 수 있어요." }, { status: 413 });
  }

  try {
    return Response.json({ reply: await askTutor(pdfBase64, messages, mode === "deep" ? "deep" : "quick") });
  } catch (e) {
    return errorResponse(e);
  }
}
