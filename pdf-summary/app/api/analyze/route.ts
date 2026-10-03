import { ANALYSIS_SCHEMA, ANALYZE_PROMPT, MAX_PDF_BYTES, MODEL, errorResponse, getClient, pdfBlock, textOf } from "@/lib/ai";
import { MOCK_ANALYSIS } from "@/lib/mock";
import type { Analysis } from "@/lib/types";

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

  if (process.env.MOCK_AI === "1") {
    await new Promise((r) => setTimeout(r, 1500));
    return Response.json(MOCK_ANALYSIS);
  }

  const data = Buffer.from(await file.arrayBuffer()).toString("base64");

  try {
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
          content: [pdfBlock(data), { type: "text", text: ANALYZE_PROMPT }],
        },
      ],
    });

    if (response.stop_reason === "refusal" || response.stop_reason === "max_tokens") {
      return Response.json(
        { error: "이 자료는 정리하지 못했어요. 다른 파일로 시도해 주세요." },
        { status: 422 },
      );
    }

    const analysis = JSON.parse(textOf(response.content)) as Analysis;
    return Response.json(analysis);
  } catch (e) {
    return errorResponse(e);
  }
}
