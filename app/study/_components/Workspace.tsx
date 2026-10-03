"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { MAX_PDF_BYTES, MAX_PDF_MB } from "@/app/study/_lib/limits";
import { deleteDoc, listDocs, saveDoc } from "@/app/study/_lib/store";
import { firstPageThumb } from "@/app/study/_lib/thumbnail";
import type { Analysis, StoredDoc } from "@/app/study/_lib/types";
import DocView from "./DocView";
import Library from "./Library";
import Upload from "./Upload";

const SAMPLE_URL = "/study/sample.pdf";

type OpenDoc = { doc: StoredDoc; pdfUrl: string; pdfBase64: string };
type View = "library" | "upload";

function toBase64(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

export default function Workspace() {
  const [docs, setDocs] = useState<StoredDoc[] | null>(null); // null: 불러오는 중
  const [view, setView] = useState<View>("library");
  const [open, setOpen] = useState<OpenDoc | null>(null);
  const [loadingName, setLoadingName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listDocs().then(async (list) => {
      setDocs(list);
      if (list.length === 0) setView("upload");

      // 미리보기가 없는 이전 문서는 하나씩 만들어 채운다
      for (const doc of list.filter((d) => !d.thumb)) {
        const thumb = await firstPageThumb(doc.pdf);
        if (!thumb) continue;
        saveDoc({ ...doc, thumb });
        setDocs((cur) => cur?.map((d) => (d.id === doc.id ? { ...d, thumb } : d)) ?? cur);
      }
    });
  }, []);

  const url = open?.pdfUrl;
  useEffect(() => {
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [url]);

  // 열려 있는 문서가 바뀔 때마다(요약·개념·카드·퀴즈가 만들어질 때) 저장한다
  const current = open?.doc;
  useEffect(() => {
    if (current) saveDoc(current);
  }, [current]);

  async function openDoc(doc: StoredDoc) {
    setOpen({ doc, pdfUrl: URL.createObjectURL(doc.pdf), pdfBase64: await toBase64(doc.pdf) });
  }

  // 열려 있던 문서의 최신 내용을 목록에 합친다 (다른 문서로 가거나 목록으로 돌아갈 때)
  function leaveCurrent() {
    if (!open) return;
    setDocs((list) => list?.map((d) => (d.id === open.doc.id ? open.doc : d)) ?? list);
  }

  async function switchDoc(target: StoredDoc) {
    if (target.id === open?.doc.id) return;
    leaveCurrent();
    await openDoc(target);
  }

  async function handleFile(file: File) {
    if (file.type !== "application/pdf") {
      setError("PDF 파일만 올릴 수 있어요.");
      return;
    }
    if (file.size > MAX_PDF_BYTES) {
      setError(`${MAX_PDF_MB}MB 이하의 PDF만 올릴 수 있어요.`);
      return;
    }

    setError(null);
    setLoadingName(file.name);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/study/api/analyze", { method: "POST", body });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "요약에 실패했어요.");

      const doc: StoredDoc = {
        id: crypto.randomUUID(),
        name: file.name,
        createdAt: Date.now(),
        pdf: file,
        thumb: (await firstPageThumb(file)) ?? undefined,
        analysis: json as Analysis,
        concepts: null,
        flashcards: null,
        quiz: null,
      };
      await saveDoc(doc);
      setDocs((list) => [doc, ...(list ?? [])]);
      await openDoc(doc);
    } catch (e) {
      setError(e instanceof Error ? e.message : "요약에 실패했어요.");
    } finally {
      setLoadingName(null);
    }
  }

  async function handleSample() {
    try {
      const res = await fetch(SAMPLE_URL);
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      await handleFile(
        new File([blob], "샘플 강의자료 - 퍼셉트론.pdf", { type: "application/pdf" }),
      );
    } catch {
      setError("샘플 파일을 불러오지 못했어요.");
    }
  }

  // 탭에서 새로 만든 내용(개념·카드·퀴즈)을 문서에 합친다. 저장은 위의 effect가 한다
  function updateDoc(patch: Partial<StoredDoc>) {
    setOpen((o) => (o ? { ...o, doc: { ...o.doc, ...patch } } : o));
  }

  async function removeDoc(doc: StoredDoc) {
    if (!window.confirm(`"${doc.analysis.title || doc.name}" 문서를 삭제할까요?`)) return;
    await deleteDoc(doc.id);
    setDocs((list) => list?.filter((d) => d.id !== doc.id) ?? list);
  }

  if (open) {
    return (
      <DocView
        key={open.doc.id}
        doc={open.doc}
        docs={(docs ?? []).map((d) => (d.id === open.doc.id ? open.doc : d))}
        pdfUrl={open.pdfUrl}
        pdfBase64={open.pdfBase64}
        onUpdate={updateDoc}
        onSwitch={switchDoc}
        onNew={() => {
          leaveCurrent();
          setOpen(null);
          setError(null);
          setView("upload");
        }}
        onBack={() => {
          leaveCurrent();
          setOpen(null);
          setView("library");
        }}
      />
    );
  }

  const hasDocs = (docs?.length ?? 0) > 0;

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-line px-5 py-4 sm:px-8">
        <Link href="/study" className="text-xl font-bold tracking-tight">
          딸각 <span className="font-normal text-muted">· 강의자료 요약</span>
        </Link>
        <div className="flex items-center gap-4 text-sm text-muted">
          {view === "upload" && hasDocs && !loadingName && (
            <button
              onClick={() => {
                setError(null);
                setView("library");
              }}
              className="hover:text-foreground"
            >
              내 문서
            </button>
          )}
          <Link href="/" className="hover:text-foreground">
            딸각 홈
          </Link>
        </div>
      </header>

      {docs === null ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-line border-t-foreground" />
        </div>
      ) : view === "library" && hasDocs ? (
        <Library
          docs={docs}
          onNew={() => {
            setError(null);
            setView("upload");
          }}
          onOpen={openDoc}
          onDelete={removeDoc}
        />
      ) : (
        <Upload
          loadingName={loadingName}
          error={error}
          onFile={handleFile}
          onSample={handleSample}
        />
      )}
    </div>
  );
}
