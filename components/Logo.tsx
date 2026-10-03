import Link from "next/link";

// 브랜드 가이드의 반원(D) 두 개를 겹친 심볼 + 워드마크
export default function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2" aria-label="딸깍 홈">
      <span className="relative flex h-6 w-6 shrink-0" aria-hidden>
        <span className="absolute left-0 top-0 h-6 w-3.5 rounded-r-full bg-brand-navy ring-1 ring-white/40" />
        <span className="absolute left-2.5 top-0 h-6 w-3.5 rounded-r-full bg-brand-sky/90" />
      </span>
      <span className={`text-xl font-bold tracking-tight ${light ? "text-white" : "text-brand-navy"}`}>
        딸깍
      </span>
    </Link>
  );
}
