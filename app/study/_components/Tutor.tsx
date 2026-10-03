"use client";

import { useEffect, useRef, useState } from "react";
import type { ChatMessage } from "@/app/study/_lib/types";
import Markdown from "./Markdown";

type Mode = "quick" | "deep";
const MODES: { id: Mode; label: string }[] = [
  { id: "quick", label: "빠른 이해" },
  { id: "deep", label: "깊은 이해" },
];

function CopyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15V6a2 2 0 0 1 2-2h9" />
    </svg>
  );
}

function RetryIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21 12a9 9 0 1 1-3-6.7" />
      <path d="M21 4v5h-5" />
    </svg>
  );
}

export default function Tutor({ pdfBase64 }: { pdfBase64: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<Mode>("quick");
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<number | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // 주어진 대화(마지막이 사용자 메시지)에 대한 답을 받아 붙인다
  async function ask(history: ChatMessage[]) {
    setMessages(history);
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/study/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pdfBase64, messages: history, mode }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "답변을 받지 못했어요.");
      setMessages([...history, { role: "assistant", content: json.reply }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "답변을 받지 못했어요.");
    } finally {
      setLoading(false);
    }
  }

  function send() {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    ask([...messages, { role: "user", content: text }]);
  }

  // 마지막 답변을 지우고 같은 질문으로 다시 받는다
  function regenerate() {
    if (loading) return;
    const last = messages.findLastIndex((m) => m.role === "user");
    if (last >= 0) ask(messages.slice(0, last + 1));
  }

  async function copy(index: number, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(index);
      setTimeout(() => setCopied((c) => (c === index ? null : c)), 1500);
    } catch {
      // 클립보드를 쓸 수 없는 환경에서는 조용히 넘어간다
    }
  }

  const lastAssistant = messages.findLastIndex((m) => m.role === "assistant");
  const canSend = input.trim().length > 0 && !loading;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl space-y-6 px-6 py-6">
          {messages.map((m, i) =>
            m.role === "user" ? (
              <div key={i} className="panel-in flex justify-end">
                <p className="max-w-[85%] whitespace-pre-wrap rounded-2xl bg-soft px-4 py-2 text-sm leading-relaxed">
                  {m.content}
                </p>
              </div>
            ) : (
              <div key={i} className="panel-in text-sm">
                <Markdown>{m.content}</Markdown>
                <div className="mt-2 flex items-center gap-4 text-xs text-muted">
                  <button
                    onClick={() => copy(i, m.content)}
                    className="flex items-center gap-1.5 hover:text-foreground"
                  >
                    <CopyIcon />
                    {copied === i ? "복사됨" : "복사"}
                  </button>
                  {i === lastAssistant && !loading && (
                    <button onClick={regenerate} className="flex items-center gap-1.5 hover:text-foreground">
                      <RetryIcon />
                      다시 생성
                    </button>
                  )}
                </div>
              </div>
            ),
          )}

          {loading && (
            <div className="flex gap-1.5 py-2" role="status" aria-label="답변을 만드는 중">
              {[0, 1, 2].map((n) => (
                <span
                  key={n}
                  className="h-2 w-2 animate-pulse rounded-full bg-muted"
                  style={{ animationDelay: `${n * 0.2}s` }}
                />
              ))}
            </div>
          )}

          {error && (
            <p role="alert" className="rounded-lg bg-bad-soft px-4 py-3 text-sm text-bad">
              {error}
            </p>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      <div className="mx-auto w-full max-w-3xl px-4 pb-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
          className="rounded-3xl border border-line bg-background px-4 pb-2 pt-3 shadow-sm focus-within:border-foreground"
        >
          <textarea
            ref={textareaRef}
            value={input}
            rows={1}
            onChange={(e) => {
              setInput(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
            }}
            onKeyDown={(e) => {
              // 한글 조합 중의 Enter는 보내지 않는다
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                send();
              }
            }}
            placeholder="이 자료에 대해 물어보세요"
            className="block max-h-40 w-full resize-none bg-transparent text-sm leading-relaxed outline-none"
          />
          <div className="mt-2 flex items-center justify-end gap-2">
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                aria-haspopup="listbox"
                aria-expanded={menuOpen}
                className="flex items-center gap-1 rounded-full px-3 py-1.5 text-sm hover:bg-soft"
              >
                {MODES.find((o) => o.id === mode)?.label}
                <span className="text-xs text-muted">⌄</span>
              </button>
              {menuOpen && (
                <ul
                  role="listbox"
                  className="menu-in absolute bottom-full right-0 mb-2 w-36 overflow-hidden rounded-xl border border-line bg-background py-1 shadow-lg"
                >
                  {MODES.map((o) => (
                    <li key={o.id} role="option" aria-selected={o.id === mode}>
                      <button
                        type="button"
                        onClick={() => {
                          setMode(o.id);
                          setMenuOpen(false);
                        }}
                        className={`block w-full px-4 py-2 text-left text-sm hover:bg-soft ${
                          o.id === mode ? "font-medium" : ""
                        }`}
                      >
                        {o.label}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <button
              type="submit"
              disabled={!canSend}
              aria-label="보내기"
              className={`flex h-9 w-9 items-center justify-center rounded-full ${
                canSend ? "bg-foreground text-background" : "bg-soft text-muted"
              }`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M12 19V5" />
                <path d="m5 12 7-7 7 7" />
              </svg>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
