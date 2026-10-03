"use client";

import { useState } from "react";
import type { Concept, Flashcard, QuizItem, StoredDoc } from "@/app/study/_lib/types";
import Concepts from "./Concepts";
import DocRail from "./DocRail";
import DocSidebar from "./DocSidebar";
import Flashcards from "./Flashcards";
import LazyPanel, { type LoadState } from "./LazyPanel";
import Quiz, { type QuizStatus } from "./Quiz";
import Summary from "./Summary";
import Tutor from "./Tutor";
import { NOTICE } from "./Upload";

const TABS = ["요약", "퀴즈", "플래시카드", "핵심 개념", "AI 튜터"] as const;
type Tab = (typeof TABS)[number];
type AidKind = "concepts" | "flashcards";

type Props = {
  doc: StoredDoc;
  docs: StoredDoc[]; // 사이드바에 보여줄 전체 문서
  pdfUrl: string;
  pdfBase64: string;
  onBack: () => void;
  onSwitch: (doc: StoredDoc) => void;
  onNew: () => void;
  onUpdate: (patch: Partial<StoredDoc>) => void;
};

async function post<T>(url: string, body: unknown, fallback: string): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? fallback);
  return json as T;
}

// 만들어 둔 내용을 지우고 처음 화면으로 돌아간다
function RemakeButton({ onClick }: { onClick: () => void }) {
  return (
    <div className="pb-8 text-center">
      <button
        onClick={onClick}
        className="text-xs text-muted underline underline-offset-4 hover:text-foreground"
      >
        다시 만들기
      </button>
    </div>
  );
}

export default function DocView({
  doc,
  docs,
  pdfUrl,
  pdfBase64,
  onBack,
  onSwitch,
  onNew,
  onUpdate,
}: Props) {
  const [tab, setTab] = useState<Tab>("요약");
  const [page, setPage] = useState<{ n: number; jump: number } | null>(null);
  const [showPdf, setShowPdf] = useState(false); // 좁은 화면에서 원본 보기
  // 문서 목록 패널. 처음에는 닫아 두고 왼쪽 레일(넓은 화면)이나 ☰(좁은 화면)로 연다
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const closeOnMobile = () => {
    if (window.innerWidth < 1024) setSidebarOpen(false);
  };
  const [aids, setAids] = useState<Record<AidKind, LoadState>>({
    concepts: { status: "idle" },
    flashcards: { status: "idle" },
  });
  const [quizRun, setQuizRun] = useState(0);
  const [quizStatus, setQuizStatus] = useState<QuizStatus>("idle");
  const [quizError, setQuizError] = useState<string | null>(null);

  async function generateAid(kind: AidKind) {
    setAids((a) => ({ ...a, [kind]: { status: "loading" } }));
    try {
      const json = await post<{ concepts?: Concept[]; flashcards?: Flashcard[] }>(
        "/study/api/generate",
        { pdfBase64, kind },
        "만들지 못했어요.",
      );
      onUpdate({ [kind]: json[kind] ?? [] });
      setAids((a) => ({ ...a, [kind]: { status: "idle" } }));
    } catch (e) {
      const error = e instanceof Error ? e.message : "만들지 못했어요.";
      setAids((a) => ({ ...a, [kind]: { status: "error", error } }));
    }
  }

  async function generateQuiz(count: number) {
    setQuizStatus("loading");
    setQuizError(null);
    try {
      const json = await post<{ quiz: QuizItem[] }>(
        "/study/api/quiz",
        { pdfBase64, count },
        "퀴즈를 만들지 못했어요.",
      );
      onUpdate({ quiz: json.quiz });
      setQuizRun((n) => n + 1);
      setQuizStatus("idle");
    } catch (e) {
      setQuizError(e instanceof Error ? e.message : "퀴즈를 만들지 못했어요.");
      setQuizStatus("error");
    }
  }

  function jumpTo(n: number) {
    setPage((p) => ({ n, jump: (p?.jump ?? 0) + 1 }));
    setShowPdf(true);
  }

  const title = doc.analysis.title || doc.name;

  return (
    <div className="study-root flex h-dvh">
      <DocRail
        listOpen={sidebarOpen}
        onToggleList={() => setSidebarOpen((v) => !v)}
        onNew={onNew}
      />
      <DocSidebar
        open={sidebarOpen}
        docs={docs}
        currentId={doc.id}
        onSwitch={(d) => {
          closeOnMobile();
          onSwitch(d);
        }}
        onNew={() => {
          closeOnMobile();
          onNew();
        }}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="grid grid-cols-[auto_1fr_auto] items-center gap-3 border-b border-line px-4 py-3 text-sm">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSidebarOpen((v) => !v)}
              aria-label="문서 목록 열기·닫기"
              aria-expanded={sidebarOpen}
              className="shrink-0 rounded-md px-1.5 py-1 text-base leading-none text-muted hover:bg-soft hover:text-foreground lg:hidden"
            >
              ☰
            </button>
            <button onClick={onBack} className="shrink-0 hover:text-muted">
              ← 돌아가기
            </button>
          </div>
          <span className="min-w-0 truncate text-center font-bold">{title}</span>
          <div className="flex min-w-16 justify-end">
            <button
              onClick={() => setShowPdf((v) => !v)}
              className="shrink-0 rounded-full bg-soft px-3 py-1.5 text-xs font-medium lg:hidden"
            >
              {showPdf ? "학습 화면" : "원본 보기"}
            </button>
          </div>
        </header>

        <div className="grid min-h-0 flex-1 lg:grid-cols-2">
          <div
            className={`${showPdf ? "block" : "hidden"} panel-in min-h-0 border-r border-line bg-soft lg:block`}
          >
            <iframe
              key={page?.jump ?? 0}
              src={page ? `${pdfUrl}#page=${page.n}` : pdfUrl}
              title={doc.name}
              className="h-full w-full"
            />
          </div>

          <div className={`${showPdf ? "hidden" : "flex"} panel-in min-h-0 min-w-0 flex-col lg:flex`}>
            <nav className="overflow-x-auto px-4 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <div className="mx-auto flex w-max gap-1">
                {TABS.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    aria-current={tab === t ? "page" : undefined}
                    className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm ${
                      tab === t
                        ? "bg-brand-navy font-medium text-background"
                        : "hover:bg-soft"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </nav>

            <div className="min-h-0 flex-1 overflow-y-auto">
              {/* 탭을 옮겨도 퀴즈 진행·튜터 대화가 유지되도록 모두 마운트해 두고 숨긴다 */}
              <div hidden={tab !== "요약"} className="panel-in">
                <Summary analysis={doc.analysis} onJump={jumpTo} />
              </div>
              <div hidden={tab !== "퀴즈"} className="panel-in">
                <Quiz
                  items={doc.quiz}
                  runId={quizRun}
                  status={quizStatus}
                  error={quizError}
                  onGenerate={generateQuiz}
                  onReset={() => onUpdate({ quiz: null })}
                />
              </div>
              <div hidden={tab !== "플래시카드"} className="panel-in">
                <LazyPanel
                  state={aids.flashcards}
                  ready={doc.flashcards !== null}
                  title="플래시카드로 외워 볼까요?"
                  description="강의자료의 핵심 내용을 질문과 답으로 된 카드로 만들어요."
                  actionLabel="플래시카드 만들기"
                  loadingLabel="플래시카드를"
                  onStart={() => generateAid("flashcards")}
                >
                  <Flashcards cards={doc.flashcards ?? []} />
                  <RemakeButton onClick={() => onUpdate({ flashcards: null })} />
                </LazyPanel>
              </div>
              <div hidden={tab !== "핵심 개념"} className="panel-in">
                <LazyPanel
                  state={aids.concepts}
                  ready={doc.concepts !== null}
                  title="핵심 개념을 정리해 볼까요?"
                  description="시험에 나올 만한 용어와 정의를 한눈에 모아 보여줘요."
                  actionLabel="핵심 개념 만들기"
                  loadingLabel="핵심 개념을"
                  onStart={() => generateAid("concepts")}
                >
                  <Concepts concepts={doc.concepts ?? []} />
                  <RemakeButton onClick={() => onUpdate({ concepts: null })} />
                </LazyPanel>
              </div>
              <div hidden={tab !== "AI 튜터"} className="panel-in h-full">
                <Tutor pdfBase64={pdfBase64} />
              </div>
            </div>

            <p className="border-t border-line px-4 py-2 text-center text-xs text-muted">{NOTICE}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
