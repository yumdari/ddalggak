import type { Analysis } from "@/app/study/_lib/types";

export default function Summary({ analysis }: { analysis: Analysis }) {
  return (
    <div className="space-y-8 p-6">
      <p className="rounded-xl bg-soft p-4 text-sm leading-relaxed">{analysis.overview}</p>
      {analysis.sections.map((s, i) => (
        <section key={i}>
          <h2 className="text-lg font-bold">{s.heading}</h2>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed">
            {s.points.map((p, j) => (
              <li key={j} className="flex gap-2">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground" />
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
