import type { ServiceMeta } from "@/lib/service";

export const service: ServiceMeta = {
  slug: "opportunities",
  no: "01",
  name: "기회 정보 큐레이션",
  summary: "공모전과 국민대학교 장학정보를 모아 맞춤 추천하고, AI가 핵심 내용을 요약해 줘요.",
  status: "ready",
  features: [
    { id: "FR-01", title: "공모전 통합 검색", required: true },
    { id: "FR-02", title: "공고 AI 요약", required: true },
    { id: "FR-03", title: "AI 맞춤 추천", required: true },
    { id: "FR-04", title: "관심 공모전·마감 관리", required: false },
  ],
};
