import Link from "next/link";
import Logo from "@/components/Logo";
import { services } from "../_registry";

// 로그인 전 첫 화면 (서비스 소개). 내용은 「(최종본) 7조딸깍_PRD.md」 기준.

const pains = [
  { tag: "기회 정보", text: "공모전·대외활동·해커톤 정보가 여러 사이트와 기관 홈페이지에 흩어져 있어요." },
  { tag: "기회 정보", text: "공고마다 형식이 달라 지원 자격과 마감일을 비교하는 데 시간이 오래 걸려요." },
  { tag: "기회 정보", text: "관심 있는 공모전을 찾아도 마감일을 놓치거나 나에게 맞는지 판단하기 어려워요." },
  { tag: "수강신청", text: "원하는 과목이 마감되면 대체 과목과 시간표를 즉석에서 다시 짜야 해요." },
  { tag: "학사 일정", text: "수강신청·정정 기간·종합시험 신청 일정을 공지에서 놓치기 쉬워요." },
  { tag: "강의자료", text: "길고 방대한 강의자료 PDF를 시험 전에 혼자 정리하고 복습하기 어려워요." },
];

const reasons = [
  { title: "준비할 시간을 돌려받아요", text: "정보 탐색과 정리에 쓰던 시간을 실제 지원과 학습 준비에 쓸 수 있어요." },
  { title: "정보 과잉을 줄여요", text: "필요 없는 공고까지 하나하나 열어 보지 않아도 돼요." },
  { title: "학점·졸업 손해를 막아요", text: "수강신청 실패와 일정 누락이 학점, 졸업 시기 문제로 번지지 않게 해요." },
];

const differences = [
  { title: "AI 개인화 추천", text: "단순 목록이 아니라, 나에게 맞는 이유까지 함께 설명해요." },
  { title: "공고 요약·자격 분석", text: "긴 모집공고를 핵심만 요약하고 지원 자격을 분석해 마감일순으로 정렬해요." },
  { title: "플랜 B·C 즉시 전환", text: "수강신청에 실패해도 남은 학점과 시간표 충돌을 반영해 다음 플랜을 바로 안내해요." },
  { title: "요약에서 바로 퀴즈", text: "강의자료 PDF를 요약하고, 요약 내용으로 곧바로 퀴즈를 만들어요." },
];

const flows = [
  {
    title: "공모전 탐색",
    steps: ["전공·학년·관심 분야 입력", "AI가 공고를 분석해 맞춤 목록 제시", "지원 자격·마감일·상금·제출서류 확인", "관심 공모전으로 저장"],
  },
  {
    title: "수강신청 플랜",
    steps: ["학기·희망 과목·학점 목표 입력", "시간 충돌·학점 상한·선수과목 점검", "플랜 A·B·C 시간표 비교", "마감 과목 표시 → 다음 플랜 즉시 안내"],
  },
  {
    title: "강의자료 학습",
    steps: ["강의자료 PDF 업로드", "쪽수·단원 범위 선택", "목차별 핵심 요약 확인", "퀴즈 풀이 → 오답 노트 저장"],
  },
];

const situations = [
  "등·하교 중 스마트폰으로 새 공모전을 확인할 때",
  "취업 준비용 포트폴리오 활동을 찾을 때",
  "방학 계획을 세울 때",
  "마감 임박한 전공 관련 공모전을 확인할 때",
  "수강신청 기간에 희망·대체 과목을 계획할 때",
  "시험 기간에 강의자료를 요약하고 퀴즈로 복습할 때",
];

const principles = [
  { title: "출처 링크 표시", text: "학사 일정과 공고 요약에는 원문 링크를 붙이고, 최종 확인은 원문 공지에서 하도록 안내해요." },
  { title: "PDF 원본 미저장", text: "강의자료는 텍스트만 추출해 본인 학습 용도로 처리하고, 원본을 저장·공유하지 않아요." },
  { title: "학교 계정 미수집", text: "학교 포털 로그인 정보를 받지 않고, 성적·시간표는 최소한만 저장해요." },
  { title: "신청은 직접", text: "공모전 신청이나 수강신청을 대행하지 않아요. 판단을 돕고, 결정은 내가 해요." },
];

const roadmap = ["공모전", "대외활동", "장학금", "인턴", "채용"];

const cardTones = ["bg-brand-ink", "bg-brand-blue", "bg-brand-bright"];

function Tag({ label, text }: { label: string; text: string }) {
  return (
    <div className="flex w-fit overflow-hidden rounded-full text-xs font-medium sm:text-sm">
      <span className="relative z-10 rounded-full bg-brand-sky px-4 py-1.5 text-white">{label}</span>
      <span className="-ml-3 rounded-r-full bg-brand-navy py-1.5 pl-6 pr-4 text-white">{text}</span>
    </div>
  );
}

function SectionHead({ label, text, title, desc }: { label: string; text: string; title: string; desc?: string }) {
  return (
    <div className="max-w-2xl">
      <Tag label={label} text={text} />
      <h2 className="mt-5 text-3xl font-bold leading-tight tracking-tight text-brand-ink sm:text-4xl">{title}</h2>
      {desc && <p className="mt-4 leading-relaxed text-muted">{desc}</p>}
    </div>
  );
}

export default function Landing() {
  return (
    <>
      <header className="sticky top-0 z-20 border-b border-line/70 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
          <Logo />
          <nav className="hidden items-center gap-7 text-sm text-muted md:flex">
            <a href="#problem" className="hover:text-brand-navy">문제</a>
            <a href="#services" className="hover:text-brand-navy">서비스</a>
            <a href="#flow" className="hover:text-brand-navy">이용 흐름</a>
            <a href="#principles" className="hover:text-brand-navy">안심 원칙</a>
          </nav>
          <Link
            href="/login"
            className="rounded-full bg-brand-navy px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-deep"
          >
            로그인
          </Link>
        </div>
      </header>

      <main className="flex-1">
        {/* 히어로 */}
        <section className="relative overflow-hidden bg-[#f4f6f8]">
          <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-brand-sky/30 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-40 -right-24 h-[28rem] w-[28rem] rounded-full bg-brand-sky/40 blur-3xl" />

          <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-5 py-20 sm:py-28 lg:grid-cols-[1.1fr_1fr]">
            <div>
              <Tag label="딸깍" text="AI 기반 학업지원 정보중계 플랫폼" />
              <h1 className="mt-7 text-4xl font-bold leading-[1.2] tracking-tight text-brand-ink sm:text-6xl">
                흩어진 학업 정보,
                <br />
                <span className="text-brand-bright">딸깍!</span> 한 번이면 돼요
              </h1>
              <p className="mt-6 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
                공모전·대외활동 정보 찾기부터 수강신청 플랜, 강의자료 정리까지.
                <br className="hidden sm:block" /> 대학생과 대학원생을 위해 AI가 대신 찾고, 정리하고, 계획해 드려요.
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <Link
                  href="/login"
                  className="rounded-full bg-brand-navy px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-brand-navy/20 transition hover:bg-brand-deep"
                >
                  로그인하고 시작하기
                </Link>
                <a
                  href="#services"
                  className="rounded-full border border-brand-navy/20 bg-white px-6 py-3.5 text-sm font-bold text-brand-navy transition hover:border-brand-navy"
                >
                  서비스 살펴보기
                </a>
              </div>
            </div>

            {/* 화면 미리보기 (예시) */}
            <div className="relative mx-auto w-full max-w-md" aria-hidden>
              <div className="absolute -left-6 top-10 h-40 w-20 rounded-r-full bg-brand-navy" />
              <div className="absolute -right-4 bottom-6 h-40 w-20 rounded-r-full bg-brand-sky" />
              <div className="relative space-y-3">
                <p className="text-right text-xs text-muted">예시 화면</p>
                <div className="rounded-2xl bg-white p-5 shadow-[0_20px_50px_-20px_rgba(0,56,102,0.35)]">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-brand-bright">AI 맞춤 추천</span>
                    <span className="rounded-full bg-bad-soft px-2 py-0.5 font-bold text-bad">D-3</span>
                  </div>
                  <p className="mt-2 font-bold text-brand-ink">대학생 AI 서비스 개발 공모전</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted">
                    추천 이유 · 컴퓨터공학 전공, 관심 분야 &lsquo;AI&rsquo;와 지원 자격이 일치해요
                  </p>
                </div>
                <div className="ml-6 rounded-2xl bg-white p-5 shadow-[0_20px_50px_-20px_rgba(0,56,102,0.35)]">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-brand-bright">수강신청 플랜</span>
                    <span className="text-muted">18학점</span>
                  </div>
                  <div className="mt-3 flex gap-1.5 text-xs font-bold">
                    <span className="rounded-md bg-soft px-2.5 py-1 text-muted line-through">플랜 A</span>
                    <span className="rounded-md bg-brand-navy px-2.5 py-1 text-white">플랜 B로 전환</span>
                    <span className="rounded-md bg-soft px-2.5 py-1 text-muted">플랜 C</span>
                  </div>
                  <p className="mt-2 text-xs text-muted">&lsquo;자료구조&rsquo; 마감 → 같은 시간대 대체 과목 반영</p>
                </div>
                <div className="rounded-2xl bg-brand-ink p-5 text-white shadow-[0_20px_50px_-20px_rgba(0,22,58,0.6)]">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-brand-sky">강의자료 요약·퀴즈</span>
                    <span className="text-white/60">3주차.pdf</span>
                  </div>
                  <p className="mt-2 text-sm font-bold">핵심 개념 6개 요약 완료 · 퀴즈 5문항 생성</p>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/15">
                    <div className="h-full w-3/5 rounded-full bg-brand-sky" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 문제 */}
        <section id="problem" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-24">
          <SectionHead label="문제" text="이런 경험, 있으시죠?" title="찾고, 비교하고, 놓치고. 학업 정보는 너무 흩어져 있어요" />
          <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pains.map((p) => (
              <li key={p.text} className="rounded-2xl border border-line p-6">
                <span className="text-xs font-bold text-brand-bright">{p.tag}</span>
                <p className="mt-2 leading-relaxed">{p.text}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* 왜 중요한가 */}
        <section className="bg-gradient-to-br from-brand-ink via-brand-deep to-brand-blue text-white">
          <div className="mx-auto grid max-w-6xl gap-10 px-5 py-20 lg:grid-cols-[1fr_2fr]">
            <h2 className="text-3xl font-bold leading-tight tracking-tight">
              작은 불편이
              <br />
              <span className="text-brand-sky">큰 손해</span>가 되기 전에
            </h2>
            <ul className="grid gap-6 sm:grid-cols-3">
              {reasons.map((r) => (
                <li key={r.title} className="border-l-2 border-brand-sky pl-4">
                  <p className="font-bold">{r.title}</p>
                  <p className="mt-2 text-sm leading-relaxed text-white/70">{r.text}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* 서비스 */}
        <section id="services" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-24">
          <SectionHead
            label="서비스"
            text="딸깍이 하는 일"
            title="세 가지 서비스로 학업 준비를 한 곳에서"
            desc="전공, 학년, 관심 분야를 알려 주면 AI가 공고를 분석해 맞는 기회를 추천하고, 수강 계획과 강의자료까지 정리해 줘요."
          />
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {services.map((s, i) => (
              <article key={s.slug} className="flex flex-col overflow-hidden rounded-3xl border border-line bg-white">
                <div className={`${cardTones[i % cardTones.length]} relative overflow-hidden px-6 pb-6 pt-7 text-white`}>
                  <div className="absolute -right-6 -top-6 h-24 w-12 rounded-r-full bg-white/10" />
                  <span className="text-sm font-bold text-brand-sky">{s.no}</span>
                  <h3 className="mt-2 text-xl font-bold leading-snug">{s.name}</h3>
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <p className="text-sm leading-relaxed text-muted">{s.summary}</p>
                  <ul className="mt-5 space-y-2 text-sm">
                    {s.features.map((f) => (
                      <li key={f.id} className="flex items-start gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-sky" />
                        <span className={f.required ? "" : "text-muted"}>
                          {f.title}
                          {!f.required && <span className="ml-1 text-xs">(예정)</span>}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* 차별점 */}
        <section className="bg-[#f4f6f8]">
          <div className="mx-auto max-w-6xl px-5 py-24">
            <SectionHead
              label="차별점"
              text="모으는 것을 넘어서"
              title="정보를 모아 보여 주는 대신, 나에게 맞는 것을 찾아 줘요"
            />
            <ul className="mt-12 grid gap-4 sm:grid-cols-2">
              {differences.map((d, i) => (
                <li key={d.title} className="flex gap-5 rounded-2xl bg-white p-6">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-r-full bg-brand-navy text-sm font-bold text-white">
                    {i + 1}
                  </span>
                  <div>
                    <p className="font-bold text-brand-ink">{d.title}</p>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted">{d.text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* 이용 흐름 */}
        <section id="flow" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-24">
          <SectionHead label="이용 흐름" text="이렇게 사용해요" title="입력은 간단하게, 정리는 AI가" />
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {flows.map((f) => (
              <div key={f.title} className="rounded-3xl border border-line p-6">
                <p className="font-bold text-brand-navy">{f.title}</p>
                <ol className="mt-5 space-y-4">
                  {f.steps.map((step, i) => (
                    <li key={step} className="flex gap-3 text-sm">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-sky/15 text-xs font-bold text-brand-bright">
                        {i + 1}
                      </span>
                      <span className="pt-0.5 leading-relaxed">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </section>

        {/* 대상과 사용 상황 */}
        <section className="bg-[#f4f6f8]">
          <div className="mx-auto grid max-w-6xl gap-12 px-5 py-24 lg:grid-cols-[1fr_1.4fr]">
            <div>
              <SectionHead label="대상" text="이런 분께 필요해요" title="대학생·대학원생부터 취업 준비생까지" />
              <div className="mt-8 flex flex-wrap gap-2">
                {["대학생", "대학원생", "취업 준비생", "연구·개발 프로젝트 희망자", "공모전·해커톤 참가자"].map((t) => (
                  <span key={t} className="rounded-full bg-white px-4 py-2 text-sm font-medium text-brand-navy">
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <ul className="grid gap-3 sm:grid-cols-2">
              {situations.map((s) => (
                <li key={s} className="rounded-2xl bg-white p-5 text-sm leading-relaxed">
                  {s}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* 확장 · 이용 방식 */}
        <section className="mx-auto max-w-6xl px-5 py-24">
          <SectionHead
            label="앞으로"
            text="확장 계획"
            title="공모전에서 시작해 커리어 전체로"
            desc="기본 검색·추천·일정 알림은 무료로 제공하고, 고급 AI 추천과 대용량 PDF 요약·퀴즈는 구독으로 제공할 예정이에요."
          />
          <ol className="mt-12 flex flex-wrap items-center gap-2">
            {roadmap.map((r, i) => (
              <li key={r} className="flex items-center gap-2">
                <span
                  className={`rounded-full px-5 py-2.5 text-sm font-bold ${
                    i === 0 ? "bg-brand-navy text-white" : "bg-brand-sky/15 text-brand-navy"
                  }`}
                >
                  {r}
                </span>
                {i < roadmap.length - 1 && <span className="text-brand-sky">→</span>}
              </li>
            ))}
          </ol>
        </section>

        {/* 안심 원칙 */}
        <section id="principles" className="scroll-mt-20 border-t border-line">
          <div className="mx-auto max-w-6xl px-5 py-24">
            <SectionHead label="안심 원칙" text="믿고 쓸 수 있도록" title="AI가 돕고, 확인과 결정은 내가" />
            <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {principles.map((p) => (
                <li key={p.title} className="rounded-2xl border border-line p-6">
                  <p className="font-bold text-brand-ink">{p.title}</p>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{p.text}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* CTA */}
        <section className="px-5 pb-24">
          <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl bg-gradient-to-r from-brand-navy to-brand-bright px-8 py-14 text-center text-white sm:py-16">
            <div className="absolute -left-10 top-1/2 h-40 w-20 -translate-y-1/2 rounded-r-full bg-white/10" />
            <div className="absolute -right-6 top-1/2 h-56 w-28 -translate-y-1/2 rounded-r-full bg-brand-sky/30" />
            <h2 className="relative text-2xl font-bold tracking-tight sm:text-3xl">이제 찾는 시간은 줄이고, 준비하는 시간은 늘리세요</h2>
            <p className="relative mt-3 text-white/75">로그인하면 세 가지 서비스를 바로 사용할 수 있어요.</p>
            <Link
              href="/login"
              className="relative mt-8 inline-block rounded-full bg-white px-7 py-3.5 text-sm font-bold text-brand-navy transition hover:bg-brand-sky hover:text-white"
            >
              딸깍 시작하기
            </Link>
          </div>
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
