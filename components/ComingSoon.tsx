import Link from "next/link";
import type { ServiceMeta } from "@/lib/service";

// 아직 만들어지지 않은 서비스의 임시 화면. 서비스를 만들기 시작하면 해당 page.tsx에서 이 컴포넌트를 지운다.
export default function ComingSoon({ service }: { service: ServiceMeta }) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-line px-5 py-4 sm:px-8">
        <Link href="/" className="text-xl font-bold tracking-tight">
          딸각
        </Link>
        <Link href="/" className="text-sm text-muted hover:text-foreground">
          ← 메인으로
        </Link>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-16">
        <p className="text-sm font-medium text-muted">{service.no}</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">{service.name}</h1>
        <p className="mt-3 text-muted">{service.summary}</p>

        <p className="mt-8 inline-block rounded-full bg-soft px-3 py-1 text-xs font-medium">
          개발 중 · 곧 만나요
        </p>

        <h2 className="mt-10 text-sm font-bold">만들 기능</h2>
        <ul className="mt-3 divide-y divide-line rounded-2xl border border-line">
          {service.features.map((f) => (
            <li key={f.id} className="flex items-center gap-3 px-4 py-3 text-sm">
              <span className="w-14 shrink-0 text-muted">{f.id}</span>
              <span className="flex-1">{f.title}</span>
              <span className="text-xs text-muted">{f.required ? "필수" : "선택"}</span>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
