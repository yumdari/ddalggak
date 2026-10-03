import type { Metadata } from "next";
import Workspace from "@/components/Workspace";

export const metadata: Metadata = { title: "작업 공간 - 딸깍 요약" };

export default function WorkspacePage() {
  return <Workspace />;
}
