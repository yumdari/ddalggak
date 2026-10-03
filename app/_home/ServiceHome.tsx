import Link from "next/link";
import Logo from "@/components/Logo";
import type { Session } from "@/lib/session";
import { services } from "../_registry";
import { logout } from "../login/actions";

const cardTones = ["bg-brand-ink", "bg-brand-blue", "bg-brand-bright"];

// 로그인한 사용자의 첫 화면 (서비스 선택)
export default function ServiceHome({ session }: { session: Session }) {
  return (
    <>
      <header className="sticky top-0 z-20 border-b border-line/70 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
          <Logo />
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted sm:inline">
              <b className="font-medium text-brand-navy">{session.name}</b>님
            </span>
            <form action={logout}>
              <button
                type="submit"
                className="rounded-full border border-brand-navy/20 bg-white px-4 py-2 text-sm font-medium text-brand-navy transition hover:border-brand-navy"
              >
                로그아웃
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="flex-1 bg-[#f4f6f8]">
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-brand-sky/30 blur-3xl" />
          <div className="pointer-events-none absolute -right-24 top-10 h-80 w-80 rounded-full bg-brand-sky/30 blur-3xl" />

          <div className="relative mx-auto max-w-3xl px-5 pb-14 pt-20 text-center sm:pt-24">
            <div className="mx-auto flex w-fit overflow-hidden rounded-full text-xs font-medium sm:text-sm">
              <span className="relative z-10 rounded-full bg-brand-sky px-4 py-1.5 text-white">{session.name}님</span>
              <span className="-ml-3 rounded-r-full bg-brand-navy py-1.5 pl-6 pr-4 text-white">오늘은 무엇을 할까요?</span>
            </div>
            <h1 className="mt-7 text-4xl font-bold leading-tight tracking-tight text-brand-ink sm:text-5xl">
              학업에 필요한 정보를
              <br />
              <span className="text-brand-bright">AI가 대신</span> 찾아줘요
            </h1>
            <p className="mt-6 text-base text-muted sm:text-lg">
              공모전 정보부터 수강신청 플랜, 강의자료 요약까지. 필요한 서비스를 골라 시작하세요.
            </p>
          </div>
        </section>

        <section className="relative mx-auto grid max-w-6xl gap-5 px-5 pb-24 md:grid-cols-3">
          {services.map((s, i) => (
            <Link
              key={s.slug}
              href={`/${s.slug}`}
              className="group flex flex-col overflow-hidden rounded-3xl border border-line bg-white transition hover:-translate-y-1 hover:shadow-[0_20px_50px_-20px_rgba(0,56,102,0.35)]"
            >
              <div className={`${cardTones[i % cardTones.length]} relative overflow-hidden px-6 pb-6 pt-7 text-white`}>
                <div className="absolute -right-6 -top-6 h-24 w-12 rounded-r-full bg-white/10" />
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-brand-sky">{s.no}</span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      s.status === "ready" ? "bg-white text-brand-navy" : "bg-white/15 text-white/80"
                    }`}
                  >
                    {s.status === "ready" ? "사용 가능" : "개발 중"}
                  </span>
                </div>
                <h2 className="mt-2 text-xl font-bold leading-snug">{s.name}</h2>
              </div>
              <div className="flex flex-1 flex-col p-6">
                <p className="text-sm leading-relaxed text-muted">{s.summary}</p>
                <ul className="mt-5 flex-1 space-y-2 text-sm">
                  {s.features.map((f) => (
                    <li key={f.id} className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-sky" />
                      <span className={f.required ? "" : "text-muted"}>{f.title}</span>
                    </li>
                  ))}
                </ul>
                <span className="mt-6 inline-block w-fit rounded-full bg-brand-navy px-5 py-2.5 text-sm font-bold text-white transition group-hover:bg-brand-deep">
                  {s.status === "ready" ? "시작하기 →" : "미리 보기 →"}
                </span>
              </div>
            </Link>
          ))}
        </section>
      </main>

      <footer className="bg-brand-ink px-5 py-10 text-white/60">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Logo light />
          <p className="text-xs">딸깍! · Kookmin AI Builder Challenge 2026</p>
        </div>
      </footer>
    </>
  );
}
