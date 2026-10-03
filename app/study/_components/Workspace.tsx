"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Analysis, QuizItem } from "@/app/study/_lib/types";
import Concepts from "./Concepts";
import Flashcards from "./Flashcards";
import Quiz, { type QuizStatus } from "./Quiz";
import Summary from "./Summary";
import Tutor from "./Tutor";

const MAX_BYTES = 4 * 1024 * 1024;
const SAMPLE_URL = "/study/sample.pdf";
const NOTICE =
  "AI가 만든 내용은 틀릴 수 있어요. 중요한 내용은 원문에서 꼭 확인하세요.";

const TABS = ["요약", "퀴즈", "플래시카드", "핵심 개념", "AI 튜터"] as const;
type Tab = (typeof TABS)[number];

type State =
  | { status: "idle" }
  | { status: "loading"; fileName: string }
  | { status: "error"; message: string }
  | { status: "done"; fileName: string; analysis: Analysis; pdfBase64: string };

function toBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export default function Workspace() {
  const [state, setState] = useState<State>({ status: "idle" });
  const [tab, setTab] = useState<Tab>("요약");
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [quiz, setQuiz] = useState<QuizItem[] | null>(null);
  const [quizRun, setQuizRun] = useState(0);
  const [quizStatus, setQuizStatus] = useState<QuizStatus>("idle");
  const [quizError, setQuizError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
  }, [pdfUrl]);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    if (file.type !== "application/pdf") {
      setState({ status: "error", message: "PDF 파일만 올릴 수 있어요." });
      return;
    }
    if (file.size > MAX_BYTES) {
      setState({ status: "error", message: "4MB 이하의 PDF만 올릴 수 있어요." });
      return;
    }

    setPdfUrl(URL.createObjectURL(file));
    setTab("요약");
    resetQuiz();
    setState({ status: "loading", fileName: file.name });

    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/study/api/analyze", { method: "POST", body });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "요약에 실패했어요.");
      setState({
        status: "done",
        fileName: file.name,
        analysis: json as Analysis,
        pdfBase64: await toBase64(file),
      });
    } catch (e) {
      setState({
        status: "error",
        message: e instanceof Error ? e.message : "요약에 실패했어요.",
      });
    }
  }

  async function loadSample() {
    try {
      const res = await fetch(SAMPLE_URL);
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      await handleFile(new File([blob], "샘플 강의자료 - 퍼셉트론.pdf", { type: "application/pdf" }));
    } catch {
      setState({ status: "error", message: "샘플 파일을 불러오지 못했어요." });
    }
  }

  function resetQuiz() {
    setQuiz(null);
    setQuizStatus("idle");
    setQuizError(null);
  }

  async function generateQuiz(count: number) {
    if (state.status !== "done") return;
    setQuizStatus("loading");
    setQuizError(null);
    try {
      const res = await fetch("/study/api/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pdfBase64: state.pdfBase64, count }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "퀴즈를 만들지 못했어요.");
      setQuiz(json.quiz as QuizItem[]);
      setQuizRun((n) => n + 1);
      setQuizStatus("idle");
    } catch (e) {
      setQuizError(e instanceof Error ? e.message : "퀴즈를 만들지 못했어요.");
      setQuizStatus("error");
    }
  }

  function reset() {
    setPdfUrl(null);
    resetQuiz();
    setState({ status: "idle" });
  }

  if (state.status === "done") {
    const { analysis, pdfBase64, fileName } = state;
    return (
      <div className="flex h-dvh flex-col">
        <header className="flex items-center gap-3 border-b border-line px-4 py-3 text-sm">
          <button onClick={reset} className="text-muted hover:text-foreground">
            ← 돌아가기
          </button>
          <span className="truncate font-medium">{analysis.title || fileName}</span>
          <button
            onClick={reset}
            className="ml-auto shrink-0 rounded-full bg-foreground px-3 py-1.5 text-xs font-medium text-background"
          >
            새 파일
          </button>
        </header>

        <div className="grid min-h-0 flex-1 lg:grid-cols-2">
          <div className="hidden min-h-0 border-r border-line bg-soft lg:block">
            {pdfUrl && <iframe src={pdfUrl} title={fileName} className="h-full w-full" />}
          </div>

          <div className="flex min-h-0 min-w-0 flex-col">
            <nav className="flex gap-2 overflow-x-auto border-b border-line px-4 py-3">
              {TABS.map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm ${
                    tab === t
                      ? "bg-foreground font-medium text-background"
                      : "bg-soft text-muted hover:text-foreground"
                  }`}
                >
                  {t}
                </button>
              ))}
            </nav>
            <div className="min-h-0 flex-1 overflow-y-auto">
              {/* 탭을 옮겨도 퀴즈 진행·튜터 대화가 유지되도록 모두 마운트해 두고 숨긴다 */}
              <div hidden={tab !== "요약"}>
                <Summary analysis={analysis} />
              </div>
              <div hidden={tab !== "퀴즈"}>
                <Quiz
                  items={quiz}
                  runId={quizRun}
                  status={quizStatus}
                  error={quizError}
                  onGenerate={generateQuiz}
                  onReset={resetQuiz}
                />
              </div>
              <div hidden={tab !== "플래시카드"}>
                <Flashcards cards={analysis.flashcards} />
              </div>
              <div hidden={tab !== "핵심 개념"}>
                <Concepts concepts={analysis.concepts} />
              </div>
              <div hidden={tab !== "AI 튜터"} className="h-full">
                <Tutor pdfBase64={pdfBase64} />
              </div>
            </div>
            <p className="border-t border-line px-4 py-2 text-center text-xs text-muted">
              {NOTICE}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-line px-5 py-4 sm:px-8">
        <Link href="/study" className="text-xl font-bold tracking-tight">
          딸각 <span className="font-normal text-muted">· 강의자료 요약</span>
        </Link>
        <Link href="/" className="text-sm text-muted hover:text-foreground">
          딸각 홈
        </Link>
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-5 py-16">
        <h1 className="text-center text-3xl font-bold tracking-tight">
          강의자료 PDF를 올려 보세요
        </h1>
        <p className="mt-3 text-center text-muted">
          요약, 핵심 개념, 플래시카드를 만들어 드려요. 퀴즈는 요약을 본 뒤 원하는 만큼 만들 수 있어요.
        </p>

        {state.status === "loading" ? (
          <div className="mt-10 flex flex-col items-center rounded-2xl border border-line px-6 py-16">
            <div className="h-9 w-9 animate-spin rounded-full border-4 border-line border-t-foreground" />
            <p className="mt-6 font-medium">AI가 자료를 읽고 정리하는 중이에요</p>
            <p className="mt-1 max-w-full truncate text-sm text-muted">{state.fileName}</p>
            <p className="mt-4 text-xs text-muted">보통 30초~1분 정도 걸려요.</p>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              handleFile(e.dataTransfer.files[0]);
            }}
            className={`mt-10 rounded-2xl border-2 border-dashed px-6 py-16 text-center transition-colors ${
              dragging ? "border-foreground bg-soft" : "border-line hover:bg-soft"
            }`}
          >
            <p className="text-lg font-medium">PDF를 끌어다 놓거나 눌러서 선택</p>
            <p className="mt-2 text-sm text-muted">4MB 이하의 PDF 파일</p>
          </button>
        )}

        {state.status !== "loading" && (
          <button
            type="button"
            onClick={loadSample}
            className="mx-auto mt-4 text-sm text-muted underline underline-offset-4 hover:text-foreground"
          >
            파일이 없다면 샘플 강의자료로 체험하기
          </button>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => {
            handleFile(e.target.files?.[0]);
            e.target.value = "";
          }}
        />

        {state.status === "error" && (
          <p role="alert" className="mt-4 rounded-lg bg-bad-soft px-4 py-3 text-center text-sm text-bad">
            {state.message}
          </p>
        )}

        <p className="mt-10 text-center text-xs leading-relaxed text-muted">
          {NOTICE} 올린 PDF는 서버에 저장되지 않아요.
          <br />
          강의자료는 본인 학습 용도로만 사용해 주세요.
        </p>
      </main>
    </div>
  );
}
