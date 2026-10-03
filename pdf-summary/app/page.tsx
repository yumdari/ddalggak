import Link from "next/link";

const features = [
  { no: "01", title: "AI 요약", desc: "수업 자료의 흐름을 따라 섹션별로 핵심만 정리해 줘요." },
  { no: "02", title: "AI 퀴즈", desc: "자료로 객관식 연습 문제를 만들고, 해설까지 확인해요." },
  { no: "03", title: "AI 플래시카드", desc: "핵심 개념을 카드로 만들어 내 속도에 맞춰 반복 암기해요." },
  { no: "04", title: "핵심 개념", desc: "시험에 나올 만한 용어와 정의를 한눈에 모아 보여줘요." },
  { no: "05", title: "AI 튜터", desc: "자료를 바탕으로 궁금한 걸 언제든 질문해요." },
];

export default function Home() {
  return (
    <>
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-background/90 px-5 py-4 backdrop-blur sm:px-8">
        <span className="text-xl font-bold tracking-tight">딸깍 요약</span>
        <Link
          href="/workspace"
          className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background"
        >
          웹에서 이용하기
        </Link>
      </header>

      <main className="flex-1">
        <section className="mx-auto max-w-3xl px-5 pb-16 pt-20 text-center sm:pt-28">
          <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
            강의자료를 AI로 정리하고,
            <br />
            퀴즈로 복습하세요.
          </h1>
          <p className="mt-6 text-base text-muted sm:text-lg">
            수업자료 PDF를 요약·핵심 개념·퀴즈·플래시카드로 바꿔보세요.
          </p>
          <Link
            href="/workspace"
            className="mt-9 inline-block rounded-full bg-foreground px-8 py-4 text-base font-medium text-background"
          >
            PDF 올리고 시작하기
          </Link>
        </section>

        <section className="mx-auto max-w-5xl px-5 pb-20">
          <div className="overflow-hidden rounded-2xl border border-line bg-soft p-3 shadow-sm sm:p-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-background p-6">
                <p className="text-xs text-muted">강의자료 PDF</p>
                <p className="mt-3 text-2xl font-bold leading-snug">
                  같은 브랜드는
                  <br />
                  어디까지 같아야 할까
                </p>
                <p className="mt-4 text-sm leading-relaxed text-muted">
                  글로벌 표준화와 현지화 사이에서 브랜드 전략을 고르는 기준을 살펴봅니다.
                </p>
              </div>
              <div className="rounded-xl bg-background p-6">
                <div className="flex flex-wrap gap-2 text-xs">
                  {["요약", "퀴즈", "플래시카드", "핵심 개념", "AI 튜터"].map((t, i) => (
                    <span
                      key={t}
                      className={
                        i === 1
                          ? "rounded-full bg-foreground px-3 py-1 text-background"
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
                  <div className="rounded-lg border border-line px-3 py-2 text-muted">
                    모든 시장에서 같은 제품 판매
                  </div>
                  <div className="rounded-lg border border-good bg-good-soft px-3 py-2">
                    핵심 정체성 유지와 현지 적응의 균형
                  </div>
                  <div className="rounded-lg border border-line px-3 py-2 text-muted">
                    현지 시장 철수
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-5 pb-24">
          <h2 className="text-center text-2xl font-bold sm:text-3xl">
            자료 하나면, 시험 준비 끝
          </h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div key={f.no} className="rounded-2xl border border-line p-6">
                <p className="text-sm font-medium text-muted">{f.no}</p>
                <h3 className="mt-3 text-lg font-bold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-soft px-5 py-20 text-center">
          <h2 className="text-2xl font-bold sm:text-3xl">지금 바로 시작하세요</h2>
          <p className="mt-3 text-muted">PDF 한 개면 충분해요. 4MB 이하의 강의자료를 올려 보세요.</p>
          <Link
            href="/workspace"
            className="mt-7 inline-block rounded-full bg-foreground px-8 py-4 text-base font-medium text-background"
          >
            웹에서 이용하기
          </Link>
        </section>
      </main>

      <footer className="border-t border-line px-5 py-8 text-center text-xs text-muted">
        딸깍 요약 · Kookmin AI Builder Challenge 2026
      </footer>
    </>
  );
}
