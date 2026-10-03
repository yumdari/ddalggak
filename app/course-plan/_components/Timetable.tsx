import { DAYS } from "../_lib/data";
import { keyOf, type PlanItem } from "../_lib/planner";

const ROWS = 20; // 9:00 ~ 19:00, 30분 칸
const COLORS = [
  "bg-brand text-white",
  "bg-brand-light text-white",
  "bg-brand-blue text-white",
  "bg-brand-navy text-white",
  "bg-brand-bright text-white",
  "bg-brand-mid text-white",
  "bg-brand-tint text-brand",
  "bg-brand-deep text-white",
];

export default function Timetable({ items, highlight }: { items: PlanItem[]; highlight?: string[] }) {
  return (
    <div className="overflow-x-auto">
      <div
        className="grid min-w-[520px] rounded-2xl border border-line text-xs"
        style={{ gridTemplateColumns: "44px repeat(5, 1fr)", gridTemplateRows: `32px repeat(${ROWS}, 22px)` }}
      >
        <div className="border-b border-line" />
        {DAYS.map((d, i) => (
          <div key={d} className="flex items-center justify-center border-b border-l border-line font-medium text-brand" style={{ gridColumn: i + 2, gridRow: 1 }}>
            {d}
          </div>
        ))}
        {Array.from({ length: ROWS / 2 }).map((_, h) => (
          <div key={h} className="border-b border-line pr-1 pt-0.5 text-right text-[10px] text-muted" style={{ gridColumn: 1, gridRow: `${h * 2 + 2} / span 2` }}>
            {9 + h}
          </div>
        ))}
        {Array.from({ length: ROWS / 2 }).map((_, h) =>
          DAYS.map((d, i) => (
            <div key={`${h}-${d}`} className="border-b border-l border-line" style={{ gridColumn: i + 2, gridRow: `${h * 2 + 2} / span 2` }} />
          )),
        )}
        {items.flatMap((it, idx) =>
          it.section.slots.map((s, k) => {
            const hl = highlight?.includes(keyOf(it.course, it.section));
            return (
              <div
                key={`${keyOf(it.course, it.section)}-${k}`}
                className={`m-0.5 overflow-hidden rounded-md px-1.5 py-1 leading-tight ${COLORS[idx % COLORS.length]} ${hl ? "ring-2 ring-bad ring-offset-1" : ""}`}
                style={{ gridColumn: s.d + 2, gridRow: `${s.s + 2} / span ${s.l}` }}
              >
                <p className="font-bold">{it.course.name}</p>
                <p className="opacity-80">{it.section.no}분반</p>
              </div>
            );
          }),
        )}
      </div>
    </div>
  );
}
