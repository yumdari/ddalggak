export type LoadState = { status: "idle" | "loading" | "error"; error?: string };

type Props = {
  state: LoadState;
  ready: boolean; // 만들어 둔 내용이 있는가
  title: string;
  description: string;
  actionLabel: string;
  loadingLabel: string;
  onStart: () => void;
  children: React.ReactNode;
};

// 사용자가 요청할 때 만드는 내용(개념·카드)의 시작·로딩·오류 화면
export default function LazyPanel({
  state,
  ready,
  title,
  description,
  actionLabel,
  loadingLabel,
  onStart,
  children,
}: Props) {
  if (ready) return <>{children}</>;

  if (state.status === "loading") {
    return (
      <div className="flex flex-col items-center px-6 py-20 text-center">
        <div className="h-9 w-9 animate-spin rounded-full border-4 border-line border-t-foreground" />
        <p className="mt-6 font-medium">{loadingLabel} 만드는 중이에요</p>
        <p className="mt-2 text-xs text-muted">보통 10~30초 정도 걸려요.</p>
      </div>
    );
  }

  return (
    <div className="px-6 py-16 text-center">
      <h2 className="text-lg font-bold">{title}</h2>
      <p className="mt-2 text-sm text-muted">{description}</p>
      <button
        onClick={onStart}
        className="mt-8 rounded-full bg-foreground px-8 py-3 text-sm font-medium text-background"
      >
        {state.status === "error" ? "다시 시도" : actionLabel}
      </button>
      {state.status === "error" && (
        <p role="alert" className="mx-auto mt-5 max-w-sm rounded-lg bg-bad-soft px-4 py-3 text-sm text-bad">
          {state.error}
        </p>
      )}
    </div>
  );
}
