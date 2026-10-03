import type { Analysis } from "@/app/study/_lib/types";
import Markdown from "./Markdown";

// 접힌 상태에서 보여줄 한 줄 미리보기 (마크다운·수식 기호를 걷어낸다)
function preview(text: string) {
  return text.replace(/[*$\\_`#>{}]/g, "").replace(/\s+/g, " ").trim().slice(0, 70);
}

export default function Summary({
  analysis,
  onJump,
}: {
  analysis: Analysis;
  onJump: (page: number) => void;
}) {
  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      <h1 className="text-2xl font-bold">요약</h1>
      <div className="mt-3 text-[15px]">
        <Markdown>{analysis.overview}</Markdown>
      </div>

      {analysis.sections.map((s, i) => (
        <section key={i} className="mt-10">
          <h2 className="text-xl font-bold">{s.heading}</h2>

          <ul className="mt-4 space-y-4 text-[15px]">
            {s.points.map((p, j) => (
              <li key={j} className="flex gap-2.5">
                <span className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-sky" />
                <div className="min-w-0 flex-1">
                  <Markdown tight>{p.text}</Markdown>
                  {p.pages.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {p.pages.map((n) => (
                        <button
                          key={n}
                          onClick={() => onJump(n)}
                          title={`원본 ${n}쪽 보기`}
                          className="rounded-full bg-soft px-2 py-0.5 text-xs text-muted hover:bg-brand-navy hover:text-background"
                        >
                          p.{n}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>

          {s.takeaway && (
            <blockquote className="mt-5 rounded-r-xl border-l-4 border-brand-sky bg-soft px-4 py-3 text-[15px]">
              <Markdown tight>{s.takeaway}</Markdown>
            </blockquote>
          )}

          {s.easy && (
            <details className="group mt-4 rounded-xl border border-line">
              <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-sm">
                <span className="text-muted group-open:hidden">＋</span>
                <span className="hidden text-muted group-open:inline">－</span>
                <span className="shrink-0 font-medium">쉬운 설명</span>
                <span className="truncate text-muted group-open:hidden">{preview(s.easy)}</span>
              </summary>
              <div className="border-t border-line px-4 py-3 text-sm">
                <Markdown>{s.easy}</Markdown>
              </div>
            </details>
          )}
        </section>
      ))}
    </div>
  );
}
