"use client";

import { useState } from "react";
import type { QuizItem } from "@/app/study/_lib/types";

export type QuizStatus = "idle" | "loading" | "error";

const COUNTS = [3, 5, 10];

type Props = {
  items: QuizItem[] | null;
  runId: number; // 새 퀴즈가 만들어질 때마다 바뀌어 풀이 상태를 초기화한다
  status: QuizStatus;
  error: string | null;
  onGenerate: (count: number) => void;
  onReset: () => void;
};

export default function Quiz({ items, runId, status, error, onGenerate, onReset }: Props) {
  if (items) return <QuizRun key={runId} items={items} onReset={onReset} />;
  return <QuizSetup status={status} error={error} onGenerate={onGenerate} />;
}

function QuizSetup({
  status,
  error,
  onGenerate,
}: Pick<Props, "status" | "error" | "onGenerate">) {
  const [count, setCount] = useState(5);

  if (status === "loading") {
    return (
      <div className="flex flex-col items-center px-6 py-20 text-center">
        <div className="h-9 w-9 animate-spin rounded-full border-4 border-line border-t-brand-sky" />
        <p className="mt-6 font-medium">퀴즈 {count}문제를 만드는 중이에요</p>
        <p className="mt-2 text-xs text-muted">보통 10~30초 정도 걸려요.</p>
      </div>
    );
  }

  return (
    <div className="px-6 py-12 text-center">
      <h2 className="text-lg font-bold">퀴즈로 복습해 볼까요?</h2>
      <p className="mt-2 text-sm text-muted">
        강의자료 내용으로 객관식 문제를 만들어요. 문제마다 힌트와 해설이 있어요.
      </p>

      <p className="mt-8 text-sm font-medium">문항 수</p>
      <div className="mt-3 flex justify-center gap-2">
        {COUNTS.map((n) => (
          <button
            key={n}
            onClick={() => setCount(n)}
            aria-pressed={count === n}
            className={`rounded-full px-5 py-2 text-sm ${
              count === n
                ? "bg-brand-navy font-medium text-background"
                : "bg-soft text-muted hover:text-foreground"
            }`}
          >
            {n}문제
          </button>
        ))}
      </div>

      <button
        onClick={() => onGenerate(count)}
        className="mt-8 rounded-full bg-brand-navy px-8 py-3 text-sm font-medium text-background"
      >
        퀴즈 만들기
      </button>

      {status === "error" && error && (
        <p role="alert" className="mt-5 rounded-lg bg-bad-soft px-4 py-3 text-sm text-bad">
          {error}
        </p>
      )}
    </div>
  );
}

function QuizRun({ items, onReset }: { items: QuizItem[]; onReset: () => void }) {
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<(number | null)[]>(() => items.map(() => null));
  const [hintShown, setHintShown] = useState<boolean[]>(() => items.map(() => false));
  const [finished, setFinished] = useState(false);

  if (items.length === 0) {
    return (
      <div className="px-6 py-12 text-center text-sm text-muted">
        <p>만들어진 퀴즈가 없어요.</p>
        <button onClick={onReset} className="mt-4 font-medium text-foreground">
          다시 만들기
        </button>
      </div>
    );
  }

  if (finished) {
    const score = items.filter((q, i) => picked[i] === q.answerIndex).length;
    return (
      <div className="flex flex-col items-center p-10 text-center">
        <p className="text-sm text-muted">퀴즈 결과</p>
        <p className="mt-2 text-5xl font-bold">
          {score} / {items.length}
        </p>
        <div className="mt-8 flex gap-3">
          <button
            onClick={() => {
              setPicked(items.map(() => null));
              setHintShown(items.map(() => false));
              setIndex(0);
              setFinished(false);
            }}
            className="rounded-full bg-brand-navy px-6 py-3 text-sm font-medium text-background"
          >
            다시 풀기
          </button>
          <button
            onClick={onReset}
            className="rounded-full bg-soft px-6 py-3 text-sm font-medium"
          >
            새 퀴즈 만들기
          </button>
        </div>
      </div>
    );
  }

  const q = items[index];
  const chosen = picked[index];
  const answered = chosen !== null;
  const last = index === items.length - 1;

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 text-xs text-muted">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-soft">
          <div
            className="h-full bg-brand-navy transition-all"
            style={{ width: `${((index + 1) / items.length) * 100}%` }}
          />
        </div>
        <span>
          {index + 1} / {items.length}
        </span>
      </div>

      <p className="mt-6 font-medium leading-relaxed">{q.question}</p>

      {!answered && (
        <div className="mt-3">
          {hintShown[index] ? (
            <p className="rounded-xl bg-soft px-4 py-3 text-sm leading-relaxed">
              <span className="font-bold">힌트 </span>
              {q.hint}
            </p>
          ) : (
            <button
              onClick={() => setHintShown((h) => h.map((v, k) => (k === index ? true : v)))}
              className="text-sm text-muted underline underline-offset-4 hover:text-foreground"
            >
              힌트 보기
            </button>
          )}
        </div>
      )}

      <div className="mt-5 space-y-2.5">
        {q.choices.map((c, i) => {
          const isAnswer = i === q.answerIndex;
          const style = !answered
            ? "border-line hover:bg-soft"
            : isAnswer
              ? "border-good bg-good-soft"
              : i === chosen
                ? "border-bad bg-bad-soft"
                : "border-line text-muted";
          return (
            <button
              key={i}
              disabled={answered}
              onClick={() => setPicked((p) => p.map((v, k) => (k === index ? i : v)))}
              className={`flex w-full gap-3 rounded-xl border px-4 py-3 text-left text-sm leading-relaxed ${style}`}
            >
              <span className="font-bold">{String.fromCharCode(65 + i)}</span>
              <span>{c}</span>
            </button>
          );
        })}
      </div>

      {answered && (
        <p className="mt-5 rounded-xl bg-soft p-4 text-sm leading-relaxed">
          <span className="font-bold">{chosen === q.answerIndex ? "정답! " : "오답. "}</span>
          {q.explanation}
        </p>
      )}

      <div className="mt-8 flex justify-between text-sm">
        <button
          disabled={index === 0}
          onClick={() => setIndex(index - 1)}
          className="text-muted hover:text-foreground disabled:opacity-30"
        >
          ← 이전
        </button>
        <button
          disabled={!answered}
          onClick={() => (last ? setFinished(true) : setIndex(index + 1))}
          className="font-medium disabled:opacity-30"
        >
          {last ? "결과 보기" : "다음 →"}
        </button>
      </div>
    </div>
  );
}
