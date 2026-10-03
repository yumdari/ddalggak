"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { nav } from "@/lib/nav";

// 모든 화면 위에 붙는 공통 헤더. 데스크톱은 마우스를 올리면 전체 메뉴가 펼쳐지고, 모바일은 햄버거 메뉴.
export default function SiteHeader() {
  const pathname = usePathname();
  const [megaOpen, setMegaOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // 메뉴 안의 링크를 누르면 열린 메뉴를 닫는다
  const closeOnLink = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("a")) {
      setMegaOpen(false);
      setMobileOpen(false);
    }
  };

  const isActive = (href: string) => {
    const base = href.split(/[?#]/)[0];
    return base !== "/" && pathname.startsWith(base);
  };

  return (
    <header
      className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur"
      onMouseLeave={() => setMegaOpen(false)}
      onClick={closeOnLink}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2" aria-label="딸깍 홈">
          <Logo />
          <span className="text-xl font-bold tracking-tight text-brand">딸깍</span>
        </Link>

        <nav className="hidden h-full md:block" onMouseEnter={() => setMegaOpen(true)}>
          <ul className="flex h-full">
            {nav.map((item) => (
              <li key={item.label} className="h-full">
                <Link
                  href={item.href}
                  className={`flex h-full w-32 items-center justify-center border-b-2 text-[15px] font-medium transition-colors ${
                    isActive(item.href)
                      ? "border-brand text-brand"
                      : "border-transparent hover:border-brand-light hover:text-brand"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/opportunities?tab=recommend"
            className="hidden rounded-full bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-mid sm:inline-block"
          >
            AI 추천 받기
          </Link>
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-brand md:hidden"
            aria-label={mobileOpen ? "메뉴 닫기" : "메뉴 열기"}
            aria-expanded={mobileOpen}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {mobileOpen ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </div>

      {/* 데스크톱 전체 메뉴 */}
      {megaOpen && (
        <div className="absolute inset-x-0 top-16 hidden border-b border-line bg-white shadow-lg md:block">
          <div className="mx-auto flex max-w-6xl justify-between px-4 sm:px-6">
            <div className="flex w-48 flex-col justify-center py-8">
              <p className="text-xs font-medium tracking-widest text-brand-light">DDALGGAK</p>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                흩어진 학업 정보를
                <br />
                딸깍 한 번에.
              </p>
            </div>
            <div className="flex">
              {nav.map((item) => (
                <ul key={item.label} className="w-32 space-y-3 py-8 text-center text-sm">
                  {item.children.map((c) => (
                    <li key={c.label}>
                      <Link href={c.href} className="text-muted hover:text-brand">
                        {c.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              ))}
            </div>
            <div className="hidden w-[8.5rem] lg:block" />
          </div>
        </div>
      )}

      {/* 모바일 메뉴 */}
      {mobileOpen && (
        <nav className="max-h-[calc(100dvh-4rem)] overflow-y-auto border-t border-line bg-white md:hidden">
          {nav.map((item) => (
            <div key={item.label} className="border-b border-line px-4 py-4">
              <Link href={item.href} className="font-bold text-brand">
                {item.label}
              </Link>
              <ul className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                {item.children.map((c) => (
                  <li key={c.label}>
                    <Link href={c.href} className="text-muted">
                      {c.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      )}
    </header>
  );
}

// 팔레트의 반원 두 개를 겹친 심볼
function Logo() {
  return (
    <svg width="30" height="26" viewBox="0 0 30 26" aria-hidden="true">
      <path d="M2 1h4a12 12 0 0 1 0 24H2z" fill="var(--brand)" />
      <path d="M14 1h4a12 12 0 0 1 0 24h-4z" fill="var(--brand-light)" />
    </svg>
  );
}
