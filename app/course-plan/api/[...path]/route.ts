import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;
const allowed = new Set(["courses", "recommend", "recommend/alternative"]);

async function proxy(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  const endpoint = path.join("/");
  if (!allowed.has(endpoint) || (request.method === "GET") !== (endpoint === "courses")) {
    return NextResponse.json({ detail: "지원하지 않는 API입니다." }, { status: 404 });
  }
  const base = process.env.BACKEND_URL || "http://127.0.0.1:8000";
  try {
    const body = request.method === "POST" ? await request.text() : undefined;
    if (body && body.length > 100_000) return NextResponse.json({ detail: "입력이 너무 큽니다." }, { status: 413 });
    const response = await fetch(`${base.replace(/\/$/, "")}/api/${endpoint}`, {
      method: request.method, headers: { "Content-Type": "application/json" }, body,
      cache: "no-store", signal: AbortSignal.timeout(55_000),
    });
    return NextResponse.json(await response.json(), { status: response.status });
  } catch {
    return NextResponse.json({ detail: "추천 서버에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요." }, { status: 503 });
  }
}
export { proxy as GET, proxy as POST };
