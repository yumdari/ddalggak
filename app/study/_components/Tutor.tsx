"use client";

import { useEffect, useRef, useState } from "react";
import type { ChatMessage } from "@/app/study/_lib/types";

export default function Tutor({ pdfBase64 }: { pdfBase64: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;

    const next: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/study/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pdfBase64, messages: next }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "답변을 받지 못했어요.");
      setMessages([...next, { role: "assistant", content: json.reply }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "답변을 받지 못했어요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-3 overflow-y-auto p-6">
        {messages.length === 0 && (
          <p className="text-sm text-muted">
            자료에서 이해가 안 되는 부분을 물어보세요. 예: “핵심 개념 3가지만 쉽게 설명해줘”
          </p>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
              m.role === "user" ? "ml-auto bg-foreground text-background" : "bg-soft"
            }`}
          >
            {m.content}
          </div>
        ))}
        {loading && <div className="w-fit rounded-2xl bg-soft px-4 py-2.5 text-sm text-muted">생각하는 중…</div>}
        {error && (
          <p role="alert" className="rounded-lg bg-bad-soft px-4 py-3 text-sm text-bad">
            {error}
          </p>
        )}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="flex gap-2 border-t border-line p-4"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="질문을 입력하세요"
          className="min-w-0 flex-1 rounded-full border border-line px-4 py-2.5 text-sm outline-none focus:border-foreground"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="shrink-0 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background disabled:opacity-40"
        >
          보내기
        </button>
      </form>
    </div>
  );
}
