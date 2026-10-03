import type { Analysis } from "@/app/study/_lib/types";

// **용어** 를 굵게 바꾼다
function RichText({ text }: { text: string }) {
  return (
    <>
      {text.split(/\*\*(.+?)\*\*/g).map((part, i) =>
        i % 2 === 1 ? <strong key={i}>{part}</strong> : part,
      )}
    </>
  );
}

export default function Summary({
  analysis,
  onJump,
}: {
  analysis: Analysis;
  onJump: (page: number) => void;
}) {
  return (
    <div className="mx-auto max-w-2xl space-y-9 px-6 py-8">
      <p className="rounded-xl bg-soft p-4 text-[15px] leading-relaxed">
        <RichText text={analysis.overview} />
      </p>
      {analysis.sections.map((s, i) => (
        <section key={i}>
          <h2 className="text-xl font-bold">{s.heading}</h2>
          <ul className="mt-4 space-y-3 text-[15px] leading-7">
            {s.points.map((p, j) => (
              <li key={j} className="flex gap-2.5">
                <span className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground" />
                <span>
                  <RichText text={p.text} />
                  {p.pages.map((n) => (
                    <button
                      key={n}
                      onClick={() => onJump(n)}
                      title={`원본 ${n}쪽 보기`}
                      className="ml-1.5 rounded-full bg-soft px-2 py-0.5 align-middle text-xs text-muted hover:bg-foreground hover:text-background"
                    >
                      p.{n}
                    </button>
                  ))}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
