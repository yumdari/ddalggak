import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "딸깍 — 나에게 좋은 강의",
  description: "학습성향과 진로에 맞는 수강전략, 수강 실패까지 준비하는 나만의 Plan B.",
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ko"><body>{children}</body></html>;
}
