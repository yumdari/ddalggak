import Link from "next/link";
import Logo from "@/components/Logo";

const features = [
  { no: "01", title: "AI 요약", desc: "수업 자료의 흐름을 따라 섹션별로 핵심만 정리해 줘요." },
  { no: "02", title: "AI 퀴즈", desc: "자료로 객관식 연습 문제를 만들고, 해설까지 확인해요." },
  { no: "03", title: "AI 플래시카드", desc: "핵심 개념을 카드로 만들어 내 속도에 맞춰 반복 암기해요." },
  { no: "04", title: "핵심 개념", desc: "시험에 나올 만한 용어와 정의를 한눈에 모아 보여줘요." },
  { no: "05", title: "AI 튜터", desc: "자료를 바탕으로 궁금한 걸 언제든 질문해요." },
];

function Tag({ label, text }: { label: string; text: string }) {
  return (
    <div className="flex w-fit overflow-hidden rounded-full text-xs font-medium sm:text-sm">
      <span className="relative z-10 rounded-full bg-brand-sky px-4 py-1.5 text-white">{label}</span>
      <span className="-ml-3 rounded-r-full bg-brand-navy py-1.5 pl-6 pr-4 text-white">{text}</span>
    </div>
  );
}

export default function Home() {
  return (
    <>
      <header className="sticky top-0 z-10 border-b border-line/70 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
          <div className="flex items-center gap-2">
            <Logo />
            <span className="text-sm text-muted">· 강의자료 요약</span>
          </div>
          <Link
            href="/study/workspace"
            className="rounded-full bg-brand-navy px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-deep"
          >
            웹에서 이용하기
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative overflow-hidden bg-[#f4f6f8]">
          <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-brand-sky/30 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-40 -right-24 h-[28rem] w-[28rem] rounded-full bg-brand-sky/40 blur-3xl" />

          <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-5 py-20 sm:py-24 lg:grid-cols-[1fr_1.05fr]">
            <div>
              <Tag label="03" text="강의자료 PDF 요약·퀴즈" />
              <h1 className="mt-7 text-4xl font-bold leading-[1.2] tracking-tight text-brand-ink sm:text-5xl">
                강의자료를 AI로 정리하고,
                <br />
                <span className="text-brand-bright">퀴즈로 복습</span>하세요
              </h1>
              <p className="mt-6 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
                수업자료 PDF를 요약·핵심 개념·퀴즈·플래시카드로 바꿔보세요.
              </p>
              <Link
                href="/study/workspace"
                className="mt-9 inline-block rounded-full bg-brand-navy px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-brand-navy/20 transition hover:bg-brand-deep"
              >
                PDF 올리고 시작하기
              </Link>
            </div>

            {/* 화면 미리보기 (예시) */}
            <div className="relative" aria-hidden>
              <div className="absolute -left-6 top-8 h-40 w-20 rounded-r-full bg-brand-navy" />
              <div className="absolute -right-4 bottom-4 h-40 w-20 rounded-r-full bg-brand-sky" />
              <div className="relative grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-white p-6 shadow-[0_20px_50px_-20px_rgba(0,56,102,0.35)]">
                  <p className="text-xs font-medium text-brand-bright">강의자료 PDF</p>
                  <p className="mt-3 text-xl font-bold leading-snug text-brand-ink">
                    같은 브랜드는
                    <br />
                    어디까지 같아야 할까
                  </p>
                  <p className="mt-4 text-sm leading-relaxed text-muted">
                    글로벌 표준화와 현지화 사이에서 브랜드 전략을 고르는 기준을 살펴봅니다.
                  </p>
                </div>
                <div className="rounded-2xl bg-white p-6 shadow-[0_20px_50px_-20px_rgba(0,56,102,0.35)]">
                  <div className="flex flex-wrap gap-1.5 text-xs">
                    {["요약", "퀴즈", "플래시카드", "핵심 개념"].map((t, i) => (
                      <span
                        key={t}
                        className={
                          i === 1
                            ? "rounded-full bg-brand-navy px-3 py-1 text-white"
                            : "rounded-full bg-soft px-3 py-1 text-muted"
                        }
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                  <p className="mt-5 text-sm font-medium leading-relaxed">
                    글로컬라이제이션 전략의 핵심으로 가장 알맞은 것은?
                  </p>
                  <div className="mt-3 space-y-2 text-sm">
                    <div className="rounded-lg border border-line px-3 py-2 text-muted">모든 시장에서 같은 제품 판매</div>
                    <div className="rounded-lg border border-brand-sky bg-brand-sky/10 px-3 py-2 font-medium text-brand-navy">
                      핵심 정체성 유지와 현지 적응의 균형
                    </div>
                    <div className="rounded-lg border border-line px-3 py-2 text-muted">현지 시장 철수</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-24">
          <div className="max-w-2xl">
            <Tag label="기능" text="자료 하나로 다섯 가지" />
            <h2 className="mt-5 text-3xl font-bold leading-tight tracking-tight text-brand-ink sm:text-4xl">
              자료 하나면, 시험 준비 끝
            </h2>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div key={f.no} className="flex gap-5 rounded-2xl border border-line p-6">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-r-full bg-brand-navy text-sm font-bold text-white">
                  {f.no}
                </span>
                <div>
                  <h3 className="font-bold text-brand-ink">{f.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="px-5 pb-24">
          <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl bg-gradient-to-r from-brand-navy to-brand-bright px-8 py-14 text-center text-white sm:py-16">
            <div className="absolute -left-10 top-1/2 h-40 w-20 -translate-y-1/2 rounded-r-full bg-white/10" />
            <div className="absolute -right-6 top-1/2 h-56 w-28 -translate-y-1/2 rounded-r-full bg-brand-sky/30" />
            <h2 className="relative text-2xl font-bold tracking-tight sm:text-3xl">지금 바로 시작하세요</h2>
            <p className="relative mt-3 text-white/75">PDF 한 개면 충분해요. 3MB 이하의 강의자료를 올려 보세요.</p>
            <Link
              href="/study/workspace"
              className="relative mt-8 inline-block rounded-full bg-white px-7 py-3.5 text-sm font-bold text-brand-navy transition hover:bg-brand-sky hover:text-white"
            >
              웹에서 이용하기
            </Link>
          </div>
        </section>
      </main>

      <footer className="bg-brand-ink px-5 py-10 text-white/60">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Logo light />
          <p className="text-xs">딸깍 · 강의자료 요약·퀴즈</p>
        </div>
      </footer>
    </>
  );
}
