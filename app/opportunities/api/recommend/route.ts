import { getRecommendations } from "../../service";

export async function POST(request: Request) {
  let body: unknown;
  try { body = await request.json(); } catch { return Response.json({ error: "올바른 요청이 아닙니다." }, { status: 400 }); }
  if (!body || typeof body !== "object") return Response.json({ error: "조건을 입력해 주세요." }, { status: 400 });
  const input = body as Record<string, unknown>;
  if (typeof input.major !== "string" || typeof input.grade !== "string" ||
      !Array.isArray(input.interests) || !input.interests.every((value) => typeof value === "string")) {
    return Response.json({ error: "전공·학년·관심 분야 형식이 올바르지 않습니다." }, { status: 400 });
  }
  const major = input.major.trim().slice(0, 50);
  const grade = input.grade.trim().slice(0, 20);
  const interests = [...new Set(input.interests.map((value: string) => value.trim().slice(0, 40)).filter(Boolean))].slice(0, 6);
  if (!major && !interests.length) return Response.json({ error: "전공이나 관심 분야를 하나 이상 입력해 주세요." }, { status: 400 });
  try {
    return Response.json(await getRecommendations({ major, grade, interests }));
  } catch {
    return Response.json({ error: "추천 공고를 불러오지 못했습니다." }, { status: 503 });
  }
}
