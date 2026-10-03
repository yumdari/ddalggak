import { analyzePdf } from "@/app/study/_lib/ai";
import { MAX_PDF_BYTES } from "@/app/study/_lib/config";
import { errorResponse } from "@/app/study/_lib/errors";

export const maxDuration = 60;

export async function POST(req: Request) {
  const form = await req.formData();
  const file = form.get("file");

  if (!(file instanceof File) || file.type !== "application/pdf") {
    return Response.json({ error: "PDF 파일만 올릴 수 있어요." }, { status: 400 });
  }
  if (file.size > MAX_PDF_BYTES) {
    return Response.json({ error: "4MB 이하의 PDF만 올릴 수 있어요." }, { status: 413 });
  }

  try {
    const data = Buffer.from(await file.arrayBuffer()).toString("base64");
    return Response.json(await analyzePdf(data));
  } catch (e) {
    return errorResponse(e);
  }
}
