"use client";

import { useState } from "react";
import type { QuizItem } from "@/lib/types";

export default function Quiz({ items }: { items: QuizItem[] }) {
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<(number | null)[]>(() => items.map(() => null));
  const [finished, setFinished] = useState(false);

  if (items.length === 0) {
    return <p className="p-6 text-sm text-muted">만들어진 퀴즈가 없어요.</p>;
  }

  if (finished) {
    const score = items.filter((q, i) => picked[i] === q.answerIndex).length;
    return (
      <div className="flex flex-col items-center p-10 text-center">
        <p className="text-sm text-muted">퀴즈 결과</p>
        <p className="mt-2 text-5xl font-bold">
          {score} / {items.length}
        </p>
        <button
          onClick={() => {
            setPicked(items.map(() => null));
            setIndex(0);
            setFinished(false);
          }}
          className="mt-8 rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background"
        >
          다시 풀기
        </button>
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
            className="h-full bg-foreground transition-all"
            style={{ width: `${((index + 1) / items.length) * 100}%` }}
          />
        </div>
        <span>
          {index + 1} / {items.length}
        </span>
      </div>

      <p className="mt-6 font-medium leading-relaxed">{q.question}</p>

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
