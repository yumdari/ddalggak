import { makeQuiz } from "@/app/study/_lib/ai";
import { MAX_PDF_BYTES, MAX_PDF_MB } from "@/app/study/_lib/limits";
import { errorResponse } from "@/app/study/_lib/errors";
import { MAX_QUIZ, MIN_QUIZ } from "@/app/study/_lib/prompts";

export const maxDuration = 60;

export async function POST(req: Request) {
  const { pdfBase64, count } = (await req.json()) as { pdfBase64?: string; count?: number };

  if (!pdfBase64 || !Number.isInteger(count) || count! < MIN_QUIZ || count! > MAX_QUIZ) {
    return Response.json(
      { error: `문항 수는 ${MIN_QUIZ}~${MAX_QUIZ} 사이로 골라 주세요.` },
      { status: 400 },
    );
  }
  if (pdfBase64.length > MAX_PDF_BYTES * 1.4) {
    return Response.json({ error: `${MAX_PDF_MB}MB 이하의 PDF만 사용할 수 있어요.` }, { status: 413 });
  }

  try {
    return Response.json({ quiz: await makeQuiz(pdfBase64, count!) });
  } catch (e) {
    return errorResponse(e);
  }
}
