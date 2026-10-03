import type { StoredDoc } from "@/app/study/_lib/types";

function dateOf(ms: number) {
  const d = new Date(ms);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export default function Library({
  docs,
  onNew,
  onOpen,
  onDelete,
}: {
  docs: StoredDoc[];
  onNew: () => void;
  onOpen: (doc: StoredDoc) => void;
  onDelete: (doc: StoredDoc) => void;
}) {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-10">
      <h1 className="text-xl font-bold">내 문서</h1>
      <p className="mt-1 text-sm text-muted">
        문서는 이 브라우저에만 저장돼요. 브라우저 데이터를 지우면 사라져요.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <button
          onClick={onNew}
          className="flex min-h-40 flex-col items-center justify-center rounded-xl bg-soft text-sm hover:bg-line"
        >
          <span className="text-3xl leading-none">+</span>
          <span className="mt-2">새로 만들기</span>
        </button>

        {docs.map((d) => (
          <div key={d.id} className="relative flex flex-col">
            <button
              onClick={() => onOpen(d)}
              className="flex min-h-40 flex-1 flex-col justify-between rounded-xl border border-line p-4 text-left hover:bg-soft"
            >
              <span className="text-xs font-medium text-muted">PDF</span>
              <span className="line-clamp-3 text-sm font-medium leading-snug">
                {d.analysis.title || d.name}
              </span>
            </button>
            <div className="mt-2 flex items-center justify-between px-1 text-xs text-muted">
              <span>{dateOf(d.createdAt)}</span>
              <button
                onClick={() => onDelete(d)}
                aria-label={`${d.name} 삭제`}
                className="hover:text-bad"
              >
                삭제
              </button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
