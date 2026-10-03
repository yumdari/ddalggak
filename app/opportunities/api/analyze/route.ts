import { getOpportunityAnalysis } from "../../service";

export async function POST(request: Request) {
  let body: unknown;
  try { body = await request.json(); } catch { return Response.json({ error: "올바른 요청이 아닙니다." }, { status: 400 }); }
  const id = typeof body === "object" && body !== null ? (body as { id?: unknown }).id : null;
  if (typeof id !== "string" || !/^[a-f0-9]{16}$/.test(id)) {
    return Response.json({ error: "공고 ID가 올바르지 않습니다." }, { status: 400 });
  }
  try {
    const analysis = await getOpportunityAnalysis(id);
    if (!analysis) return Response.json({ error: "공고를 찾을 수 없습니다." }, { status: 404 });
    return Response.json({ analysis });
  } catch {
    return Response.json({ error: "공고를 분석하지 못했습니다." }, { status: 503 });
  }
}
