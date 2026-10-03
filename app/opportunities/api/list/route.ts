import { getOpportunities } from "../../_lib/feeds";
import { searchOpportunities } from "../../_lib/catalog";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = (url.searchParams.get("q") ?? "").slice(0, 100);
  const field = (url.searchParams.get("field") ?? "all").slice(0, 50);
  const deadline = url.searchParams.get("deadline") ?? "all";
  const sort = url.searchParams.get("sort") ?? "recent";
  try {
    const items = searchOpportunities(await getOpportunities(), {
      query, field,
      deadline: deadline === "week" || deadline === "known" ? deadline : "all",
      sort: sort === "deadline" ? "deadline" : "recent",
    });
    return Response.json({ items: items.slice(0, 100), total: items.length, updatedAt: new Date().toISOString() });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "공고를 불러오지 못했습니다." }, { status: 503 });
  }
}
