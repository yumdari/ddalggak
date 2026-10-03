import Link from "next/link";

function Icon({ children }: { children: React.ReactNode }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {children}
    </svg>
  );
}

function RailButton({
  label,
  active,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      aria-pressed={active}
      className={`flex h-9 w-9 items-center justify-center rounded-lg hover:bg-soft ${
        active ? "bg-soft" : ""
      }`}
    >
      {children}
    </button>
  );
}

// 문서 화면 왼쪽의 좁은 아이콘 줄 (넓은 화면에서만 보인다)
export default function DocRail({
  listOpen,
  onToggleList,
  onNew,
}: {
  listOpen: boolean;
  onToggleList: () => void;
  onNew: () => void;
}) {
  return (
    <nav
      aria-label="바로가기"
      className="hidden w-12 shrink-0 flex-col items-center gap-1 border-r border-line py-3 lg:flex"
    >
      <Link
        href="/"
        aria-label="딸깍 홈"
        title="딸깍 홈"
        className="relative mb-3 flex h-9 w-9 items-center justify-center"
      >
        <span className="absolute left-2 top-1.5 h-6 w-3.5 rounded-r-full bg-brand-navy" />
        <span className="absolute left-4 top-1.5 h-6 w-3.5 rounded-r-full bg-brand-sky/90" />
      </Link>
      <RailButton label="새로 만들기" onClick={onNew}>
        <Icon>
          <path d="M12 5v14" />
          <path d="M5 12h14" />
        </Icon>
      </RailButton>
      <RailButton label="내 문서" active={listOpen} onClick={onToggleList}>
        <Icon>
          <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        </Icon>
      </RailButton>
    </nav>
  );
}
