import Link from "next/link";
import { services } from "./_registry";

export default function Home() {
  return (
    <>
      <header className="flex items-center justify-between border-b border-line px-5 py-4 sm:px-8">
        <span className="text-xl font-bold tracking-tight">딸각</span>
        <span className="text-xs text-muted">Kookmin AI Builder Challenge 2026</span>
      </header>

      <main className="flex-1">
        <section className="mx-auto max-w-3xl px-5 pb-12 pt-20 text-center sm:pt-28">
          <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
            학업에 필요한 정보를
            <br />
            AI가 대신 찾아줘요
          </h1>
          <p className="mt-6 text-base text-muted sm:text-lg">
            공모전 정보부터 수강신청 플랜, 강의자료 요약까지. 필요한 서비스를 골라 시작하세요.
          </p>
        </section>

        <section className="mx-auto grid max-w-5xl gap-4 px-5 pb-24 md:grid-cols-3">
          {services.map((s) => (
            <Link
              key={s.slug}
              href={`/${s.slug}`}
              className="group flex flex-col rounded-2xl border border-line p-6 transition-colors hover:bg-soft"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted">{s.no}</span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    s.status === "ready" ? "bg-good-soft text-good" : "bg-soft text-muted"
                  }`}
                >
                  {s.status === "ready" ? "사용 가능" : "개발 중"}
                </span>
              </div>
              <h2 className="mt-4 text-xl font-bold leading-snug">{s.name}</h2>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{s.summary}</p>
              <ul className="mt-5 space-y-1.5 text-sm">
                {s.features.map((f) => (
                  <li key={f.id} className="flex gap-2">
                    <span className="text-muted">·</span>
                    <span className={f.required ? "" : "text-muted"}>{f.title}</span>
                  </li>
                ))}
              </ul>
              <span className="mt-6 inline-block w-fit rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background">
                {s.status === "ready" ? "시작하기" : "미리 보기"}
              </span>
            </Link>
          ))}
        </section>
      </main>

      <footer className="border-t border-line px-5 py-8 text-center text-xs text-muted">
        7조 · 딸각
      </footer>
    </>
  );
}
