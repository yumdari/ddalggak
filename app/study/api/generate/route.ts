import { makeConcepts, makeFlashcards } from "@/app/study/_lib/ai";
import { MAX_PDF_BYTES, MAX_PDF_MB } from "@/app/study/_lib/limits";
import { errorResponse } from "@/app/study/_lib/errors";

export const maxDuration = 60;

// 탭을 열 때 필요한 학습 자료를 따로 만든다 (kind: concepts | flashcards)
export async function POST(req: Request) {
  const { pdfBase64, kind } = (await req.json()) as { pdfBase64?: string; kind?: string };

  if (!pdfBase64 || (kind !== "concepts" && kind !== "flashcards")) {
    return Response.json({ error: "잘못된 요청이에요." }, { status: 400 });
  }
  if (pdfBase64.length > MAX_PDF_BYTES * 1.4) {
    return Response.json({ error: `${MAX_PDF_MB}MB 이하의 PDF만 사용할 수 있어요.` }, { status: 413 });
  }

  try {
    return Response.json(
      kind === "concepts"
        ? { concepts: await makeConcepts(pdfBase64) }
        : { flashcards: await makeFlashcards(pdfBase64) },
    );
  } catch (e) {
    return errorResponse(e);
  }
}
