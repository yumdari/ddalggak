import type { StoredDoc } from "@/app/study/_lib/types";

function dateOf(ms: number) {
  const d = new Date(ms);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

type Props = {
  open: boolean;
  docs: StoredDoc[];
  currentId: string;
  onSwitch: (doc: StoredDoc) => void;
  onNew: () => void;
  onClose: () => void;
};

// 다른 문서로 빠르게 이동하는 사이드바.
// 닫혀 있어도 항상 그려 두고 움직임으로 여닫는다: 넓은 화면에서는 너비가 열리고 닫히고,
// 좁은 화면에서는 왼쪽에서 밀려 나오는 서랍이 되며 뒤 배경이 서서히 어두워진다.
export default function DocSidebar({ open, docs, currentId, onSwitch, onNew, onClose }: Props) {
  return (
    <>
      <div
        onClick={onClose}
        aria-hidden
        className={`fixed inset-0 z-20 bg-black/30 transition-opacity duration-300 lg:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      <aside
        aria-label="내 문서"
        inert={!open}
        className={`fixed inset-y-0 left-0 z-30 w-64 shrink-0 overflow-hidden border-r border-line bg-background transition-transform duration-300 ease-out lg:static lg:z-auto lg:translate-x-0 lg:transition-[width,border-color] ${
          open
            ? "translate-x-0 shadow-xl lg:w-64 lg:shadow-none"
            : "-translate-x-full lg:w-0 lg:border-transparent"
        }`}
      >
        {/* 안쪽은 너비를 고정해, 바깥 너비가 변하는 동안 글자가 다시 줄바꿈되지 않게 한다 */}
        <div className="flex h-full w-64 flex-col">
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
        </div>
      </aside>
    </>
  );
}
