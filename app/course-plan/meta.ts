import type { ServiceMeta } from "@/lib/service";

export const service: ServiceMeta = {
  slug: "course-plan",
  no: "02",
  name: "수강신청·학사 일정 도우미",
  summary: "수강신청 플랜 A·B·C를 만들고, 마감된 과목이 생기면 다음 플랜을 바로 안내해 줘요.",
  status: "soon",
  features: [
    { id: "FR-05", title: "학사 일정 알림", required: true },
    { id: "FR-06", title: "수강신청 플랜 A·B·C 생성", required: true },
    { id: "FR-07", title: "신청 실패 시 플랜 전환 안내", required: true },
    { id: "FR-08", title: "졸업 요건·종합시험 점검", required: false },
  ],
};
