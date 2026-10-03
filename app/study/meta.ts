import type { ServiceMeta } from "@/lib/service";

export const service: ServiceMeta = {
  slug: "study",
  no: "03",
  name: "강의자료 PDF 요약·퀴즈",
  summary: "강의자료 PDF를 올리면 AI가 핵심을 요약하고, 퀴즈로 바로 복습할 수 있게 해줘요.",
  status: "ready",
  features: [
    { id: "FR-09", title: "강의자료 PDF 요약", required: true },
    { id: "FR-10", title: "퀴즈 생성", required: true },
    { id: "FR-11", title: "시험 범위 선택·오답 노트", required: false },
  ],
};
