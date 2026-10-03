import type { Concept } from "@/lib/types";

export default function Concepts({ concepts }: { concepts: Concept[] }) {
  return (
    <div className="space-y-3 p-6">
      {concepts.map((c, i) => (
        <div key={i} className="rounded-xl border border-line p-4">
          <p className="font-bold">{c.term}</p>
          <p className="mt-1 text-sm leading-relaxed text-muted">{c.definition}</p>
        </div>
      ))}
    </div>
  );
}
