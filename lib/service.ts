// 서비스 소개 정보의 공통 타입. 각 서비스는 자기 폴더의 meta.ts에서 이 타입으로 정보를 내보낸다.

export type Feature = {
  id: string; // PRD 요구사항 ID (예: FR-09)
  title: string;
  required: boolean; // PRD 우선순위가 필수인지
};

export type ServiceMeta = {
  slug: string; // 경로 이름. app/<slug>/ 폴더 이름과 같아야 한다
  no: string; // 메인 화면 표시용 번호
  name: string;
  summary: string;
  status: "ready" | "soon"; // ready: 사용 가능, soon: 개발 중
  features: Feature[];
};
