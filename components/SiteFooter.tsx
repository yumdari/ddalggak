import Link from "next/link";
import { nav } from "@/lib/nav";

export default function SiteFooter() {
  return (
    <footer className="bg-brand-deep text-white/70">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_2fr]">
        <div>
          <p className="text-xl font-bold text-white">딸깍</p>
          <p className="mt-3 text-sm leading-relaxed">
            AI 기반 학업지원 정보중개 플랫폼
            <br />
            공모전 큐레이션 · 수강신청 플랜 · 강의자료 요약·퀴즈
          </p>
        </div>
        <div className="grid grid-cols-2 gap-6 text-sm sm:grid-cols-4">
          {nav.map((item) => (
            <div key={item.label}>
              <Link href={item.href} className="font-medium text-white">
                {item.label}
              </Link>
              <ul className="mt-3 space-y-2">
                {item.children.map((c) => (
                  <li key={c.label}>
                    <Link href={c.href} className="hover:text-white">
                      {c.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-5 text-xs sm:flex-row sm:justify-between sm:px-6">
          <span>7조 · 딸깍 | Kookmin AI Builder Challenge 2026</span>
          <span>AI가 제공하는 정보는 참고용입니다. 최종 확인은 원문 공지에서 해 주세요.</span>
        </div>
      </div>
    </footer>
  );
}
