export type LoadState = { status: "idle" | "loading" | "error"; error?: string };

// 탭을 열 때 만드는 내용의 로딩·오류 화면
export default function LazyPanel({
  state,
  label,
  onRetry,
  children,
}: {
  state: LoadState;
  label: string;
  onRetry: () => void;
  children: React.ReactNode;
}) {
  if (state.status === "error") {
    return (
      <div className="px-6 py-16 text-center">
        <p role="alert" className="mx-auto max-w-sm rounded-lg bg-bad-soft px-4 py-3 text-sm text-bad">
          {state.error}
        </p>
        <button
          onClick={onRetry}
          className="mt-5 rounded-full bg-foreground px-6 py-2.5 text-sm font-medium text-background"
        >
          다시 시도
        </button>
      </div>
    );
  }

  if (state.status === "loading") {
    return (
      <div className="flex flex-col items-center px-6 py-20 text-center">
        <div className="h-9 w-9 animate-spin rounded-full border-4 border-line border-t-foreground" />
        <p className="mt-6 font-medium">{label} 만드는 중이에요</p>
        <p className="mt-2 text-xs text-muted">보통 10~30초 정도 걸려요.</p>
      </div>
    );
  }

  return <>{children}</>;
}
