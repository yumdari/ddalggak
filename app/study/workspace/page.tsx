import type { Metadata } from "next";
import Workspace from "@/app/study/_components/Workspace";

export const metadata: Metadata = { title: "작업 공간 - 강의자료 요약·퀴즈" };

export default function WorkspacePage() {
  return <Workspace />;
}
