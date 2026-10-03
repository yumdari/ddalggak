"use client";

import { useRef, useState } from "react";
import { MAX_PDF_MB } from "@/app/study/_lib/limits";

export const NOTICE = "AI가 만든 내용은 틀릴 수 있어요. 중요한 내용은 원문에서 꼭 확인하세요.";

type Props = {
  loadingName: string | null; // 요약 중인 파일 이름
  error: string | null;
  onFile: (file: File) => void;
  onSample: () => void;
};

export default function Upload({ loadingName, error, onFile, onSample }: Props) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <main className="panel-in mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-5 py-16">
      <h1 className="text-center text-3xl font-bold tracking-tight">강의자료 PDF를 올려 보세요</h1>
      <p className="mt-3 text-center text-muted">
        먼저 요약을 만들어 드려요. 핵심 개념, 플래시카드, 퀴즈는 탭을 열 때 바로 만들어요.
      </p>

      {loadingName ? (
        <div className="mt-10 flex flex-col items-center rounded-2xl border border-line px-6 py-16">
          <div className="h-9 w-9 animate-spin rounded-full border-4 border-line border-t-foreground" />
          <p className="mt-6 font-medium">AI가 자료를 읽고 요약하는 중이에요</p>
          <p className="mt-1 max-w-full truncate text-sm text-muted">{loadingName}</p>
          <p className="mt-4 text-xs text-muted">보통 20~40초 정도 걸려요.</p>
        </div>
      ) : (
        <>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              const file = e.dataTransfer.files[0];
              if (file) onFile(file);
            }}
            className={`mt-10 w-full rounded-2xl border-2 border-dashed px-6 py-16 text-center transition-colors ${
              dragging ? "border-foreground bg-soft" : "border-line hover:bg-soft"
            }`}
          >
            <p className="text-lg font-medium">PDF를 끌어다 놓거나 눌러서 선택</p>
            <p className="mt-2 text-sm text-muted">{MAX_PDF_MB}MB 이하의 PDF 파일</p>
          </button>

          <button
            type="button"
            onClick={onSample}
            className="mx-auto mt-4 text-sm text-muted underline underline-offset-4 hover:text-foreground"
          >
            파일이 없다면 샘플 강의자료로 체험하기
          </button>
        </>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
          e.target.value = "";
        }}
      />

      {error && (
        <p role="alert" className="mt-4 rounded-lg bg-bad-soft px-4 py-3 text-center text-sm text-bad">
          {error}
        </p>
      )}

      <p className="mt-10 text-center text-xs leading-relaxed text-muted">
        {NOTICE} 올린 PDF는 서버에 저장되지 않아요.
        <br />
        강의자료는 본인 학습 용도로만 사용해 주세요.
      </p>
    </main>
  );
}
