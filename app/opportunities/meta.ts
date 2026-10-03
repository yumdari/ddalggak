import type { ServiceMeta } from "@/lib/service";

export const service: ServiceMeta = {
  slug: "opportunities",
  no: "01",
  name: "기회 정보 큐레이션",
  summary: "흩어진 공모전·대외활동·해커톤 정보를 한곳에서 검색하고, AI가 요약·추천해 줘요.",
  status: "ready",
  features: [
    { id: "FR-01", title: "공모전 통합 검색", required: true },
    { id: "FR-02", title: "공고 AI 요약", required: true },
    { id: "FR-03", title: "AI 맞춤 추천", required: true },
    { id: "FR-04", title: "관심 공모전·마감 관리", required: false },
  ],
};
