"use client";

import { useState } from "react";
import "./flashcard.css";
import type { Flashcard } from "@/app/study/_lib/types";

export default function Flashcards({ cards }: { cards: Flashcard[] }) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  if (cards.length === 0) {
    return <p className="p-6 text-sm text-muted">만들어진 카드가 없어요.</p>;
  }

  const card = cards[index];
  const go = (next: number) => {
    setFlipped(false);
    setIndex(next);
  };

  return (
    <div className="p-6">
      <p className="text-center text-xs text-muted">
        {index + 1} / {cards.length} · 카드를 눌러 뒤집어 보세요
      </p>

      <button
        onClick={() => setFlipped(!flipped)}
        aria-label="카드 뒤집기"
        className="flip-scene mt-5 block h-64 w-full"
      >
        <div data-flipped={flipped} className="flip-card relative h-full w-full">
          <div className="flip-face absolute inset-0 flex items-center justify-center rounded-2xl border border-line bg-background p-8 text-center text-lg font-medium leading-relaxed">
            {card.front}
          </div>
          <div className="flip-face flip-back absolute inset-0 flex items-center justify-center rounded-2xl bg-foreground p-8 text-center leading-relaxed text-background">
            {card.back}
          </div>
        </div>
      </button>

      <div className="mt-6 flex justify-between text-sm">
        <button
          disabled={index === 0}
          onClick={() => go(index - 1)}
          className="text-muted hover:text-foreground disabled:opacity-30"
        >
          ← 이전
        </button>
        <button
          disabled={index === cards.length - 1}
          onClick={() => go(index + 1)}
          className="font-medium disabled:opacity-30"
        >
          다음 →
        </button>
      </div>
    </div>
  );
}
