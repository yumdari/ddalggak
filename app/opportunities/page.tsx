import type { Metadata } from "next";
import ComingSoon from "@/components/ComingSoon";
import { service } from "./meta";

export const metadata: Metadata = { title: `${service.name} - 딸각` };

// TODO: 개발 시작하면 ComingSoon 대신 실제 화면으로 교체
export default function OpportunitiesPage() {
  return <ComingSoon service={service} />;
}
