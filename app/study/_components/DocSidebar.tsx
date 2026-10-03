import type { StoredDoc } from "@/app/study/_lib/types";

function dateOf(ms: number) {
  const d = new Date(ms);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

type Props = {
  docs: StoredDoc[];
  currentId: string;
  onSwitch: (doc: StoredDoc) => void;
  onNew: () => void;
  onClose: () => void;
};

// 다른 문서로 빠르게 이동하는 사이드바. 좁은 화면에서는 위에 겹쳐 뜬다
export default function DocSidebar({ docs, currentId, onSwitch, onNew, onClose }: Props) {
  return (
    <>
      <div className="fixed inset-0 z-20 bg-black/30 lg:hidden" onClick={onClose} aria-hidden />
      <aside
        aria-label="내 문서"
        className="fixed inset-y-0 left-0 z-30 flex w-64 shrink-0 flex-col border-r border-line bg-background shadow-xl lg:static lg:z-auto lg:shadow-none"
      >
        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-sm font-bold">내 문서</span>
          <button
            onClick={onClose}
            aria-label="사이드바 닫기"
            className="rounded-md px-2 py-1 text-muted hover:bg-soft hover:text-foreground"
          >
            ✕
          </button>
        </div>

        <div className="px-3 pb-2">
          <button
            onClick={onNew}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-soft"
          >
            <span className="text-lg leading-none">+</span>
            <span>새로 만들기</span>
          </button>
        </div>

        <ul className="min-h-0 flex-1 space-y-0.5 overflow-y-auto px-3 pb-4">
          {docs.map((d) => {
            const current = d.id === currentId;
            return (
              <li key={d.id}>
                <button
                  onClick={() => onSwitch(d)}
                  aria-current={current ? "page" : undefined}
                  className={`block w-full rounded-lg px-3 py-2 text-left ${
                    current ? "bg-soft" : "hover:bg-soft"
                  }`}
                >
                  <span
                    className={`line-clamp-2 text-sm leading-snug ${current ? "font-medium" : ""}`}
                  >
                    {d.analysis.title || d.name}
                  </span>
                  <span className="mt-0.5 block text-xs text-muted">{dateOf(d.createdAt)}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </aside>
    </>
  );
}
