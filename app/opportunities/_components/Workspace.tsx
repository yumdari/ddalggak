"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { CATEGORY_LABELS, daysUntil, FIELDS, type Opportunity, type OpportunityCategory, type Recommendation } from "../_lib/catalog";
import type { Analysis } from "../_lib/ai";

type View = "discover" | "recommend" | "saved";
type SearchResult = { items: Opportunity[]; total: number };
type RecommendationResult = { mode: "ai" | "rules"; recommendations: Recommendation[] };
const BOOKMARK_KEY = "ddalggak:opportunities:bookmarks";

function deadlineLabel(item: Opportunity): string {
  const days = daysUntil(item.deadline);
  if (days === null) return "마감일 원문 확인";
  if (days === 0) return "D-DAY";
  return days > 0 ? `D-${days}` : "마감";
}

async function jsonRequest<T>(url: string, body?: object): Promise<T> {
  const response = await fetch(url, body ? {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
  } : undefined);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error ?? "요청을 처리하지 못했습니다.");
  return data as T;
}

function OpportunityCard({ item, reason, saved, onSave, onOpen }: {
  item: Opportunity; reason?: string; saved: boolean; onSave: () => void; onOpen: () => void;
}) {
  return <article className="flex flex-col rounded-[22px] border border-[#e3e9df] bg-white p-5 shadow-[0_8px_28px_rgba(38,61,40,.04)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_35px_rgba(38,61,40,.09)] sm:p-6">
    <div className="mb-5 flex items-center justify-between gap-2">
      <span className="rounded-full bg-[#eef6ed] px-3 py-1 text-xs font-semibold text-[#386b44]">{CATEGORY_LABELS[item.category]} · {item.field === "기타" ? "세부 분야 미확인" : item.field}</span>
      <span className="text-xs font-bold text-[#d2663d]">{deadlineLabel(item)}</span>
    </div>
    <h3 className="mb-2 line-clamp-2 text-lg font-bold leading-snug tracking-[-.03em] text-[#24372b]">{item.title}</h3>
    <p className="mb-4 text-sm text-[#7b897c]">{item.source}</p>
    <dl className="mb-4 flex items-center gap-3 rounded-xl bg-[#f7f9f4] px-4 py-3 text-sm"><dt className="font-semibold text-[#638067]">마감일</dt><dd className="font-bold text-[#344638]">{item.deadline ? item.deadline.replaceAll("-", ".") : "원문 확인 필요"}</dd></dl>
    {reason && <p className="mb-4 rounded-xl bg-[#f5f8ec] p-3 text-sm leading-5 text-[#526e3a]">✦ {reason}</p>}
    <div className="mt-auto flex items-center justify-between border-t border-[#eef0e9] pt-4">
      <button type="button" onClick={onOpen} className="text-sm font-bold text-[#286a43] hover:underline">핵심 내용 보기 →</button>
      <button type="button" onClick={onSave} aria-label={saved ? "관심 공고 해제" : "관심 공고 저장"} aria-pressed={saved} className="rounded-full border border-[#dbe4d8] px-3 py-1.5 text-sm text-[#47704f] hover:bg-[#eef6ed]">{saved ? "♥ 저장됨" : "♡ 저장"}</button>
    </div>
  </article>;
}

function DetailPanel({ item, analysis, loading, onClose }: {
  item: Opportunity; analysis: Analysis | null; loading: boolean; onClose: () => void;
}) {
  const fields = analysis ? [
    ["핵심 내용", analysis.overview], ["지원 자격", analysis.eligibility], ["분야", analysis.field],
    ["상금·혜택", analysis.benefits], ["일정", analysis.schedule], ["제출 자료", analysis.deliverables],
  ] as const : [];
  const sourceMessage = analysis?.fallbackReason === "missing-key"
    ? "Gemini API 키가 설정되지 않아 수집한 원문 정보를 보여드려요."
    : analysis?.fallbackReason === "no-text"
      ? "이 공지는 본문이 이미지로 제공되어 텍스트 요약을 만들 수 없어요. 공식 원문을 확인해 주세요."
      : "Gemini 요약을 불러오지 못해 수집한 원문 정보를 보여드려요.";
  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#14291bcc] p-0 sm:items-center sm:p-5" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section role="dialog" aria-modal="true" aria-label="공고 핵심 내용" className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-[26px] bg-white p-6 shadow-2xl sm:rounded-[26px] sm:p-8">
      <div className="mb-5 flex items-start justify-between gap-4"><div><span className="text-xs font-bold text-[#599165]">{CATEGORY_LABELS[item.category]} · {item.field === "기타" ? "세부 분야 미확인" : `${item.field} (추정)`} · {item.source}</span><h2 className="mt-2 text-2xl font-bold leading-snug tracking-[-.04em]">{item.title}</h2></div><button type="button" onClick={onClose} aria-label="닫기" className="rounded-full bg-[#f0f4ec] px-3 py-1.5 text-lg">×</button></div>
      <div className="mb-6 flex flex-wrap gap-2 text-xs text-[#738575]"><span className="rounded-full bg-[#f0f4ec] px-3 py-1.5">{deadlineLabel(item)}</span><span className="rounded-full bg-[#f0f4ec] px-3 py-1.5">{item.deadline ? `마감 ${item.deadline}` : "정확한 마감일은 원문 확인"}</span></div>
      {loading ? <p className="py-10 text-center text-sm text-[#758675]">핵심 내용을 정리하고 있어요…</p> : analysis?.mode === "ai" ? <><p className="mb-5 text-xs font-bold text-[#6a8d5f]">Gemini 분석 · 확인된 항목에 원문 근거 표시</p><div className="grid gap-4 sm:grid-cols-2">{fields.map(([label, value]) => <div key={label} className="rounded-xl bg-[#f7f9f4] p-4"><h3 className="mb-2 text-xs font-bold text-[#488159]">{label}</h3><p className="text-sm leading-6 text-[#344638]">{value.text}</p>{value.evidence && <p className="mt-2 border-l-2 border-[#b5d6aa] pl-2 text-xs leading-5 text-[#839182]">근거: {value.evidence.slice(0, 180)}</p>}</div>)}</div></> : <div className="mb-5 rounded-xl bg-[#f7f9f4] p-5"><p className="mb-3 text-xs font-bold text-[#6a8d5f]">{sourceMessage}</p>{analysis?.fallbackReason !== "no-text" && <p className="whitespace-pre-wrap text-sm leading-7 text-[#526254]">{analysis?.overview.text || item.description || "원문에서 상세 내용을 확인해 주세요."}</p>}</div>}
      <div className="mt-6 border-t border-[#e8eee5] pt-5"><p className="mb-4 text-xs leading-5 text-[#8b9688]">이 내용은 참고용입니다. 지원 자격과 일정은 원문 공지에서 최종 확인하세요.</p><a href={item.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-block rounded-xl bg-[#2f7048] px-5 py-3 text-sm font-bold text-white hover:bg-[#225a38]">공식 원문 확인 ↗</a></div>
    </section>
  </div>;
}

export default function Workspace() {
  const [view, setView] = useState<View>("discover");
  const [category, setCategory] = useState<OpportunityCategory>("contest");
  const [query, setQuery] = useState("");
  const [field, setField] = useState("all");
  const [deadline, setDeadline] = useState("all");
  const [sort, setSort] = useState("recent");
  const [items, setItems] = useState<Opportunity[]>([]);
  const [allItems, setAllItems] = useState<Opportunity[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [major, setMajor] = useState("");
  const [grade, setGrade] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [recommendationMode, setRecommendationMode] = useState<"ai" | "rules" | null>(null);
  const [recommending, setRecommending] = useState(false);
  const recommendationRequest = useRef(0);
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [selected, setSelected] = useState<Opportunity | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    try {
      const value = JSON.parse(localStorage.getItem(BOOKMARK_KEY) ?? "[]");
      if (Array.isArray(value)) queueMicrotask(() => setBookmarks(value.filter((id): id is string => typeof id === "string")));
    } catch { /* Browser storage is optional. */ }
    jsonRequest<SearchResult>("/opportunities/api/list?sort=recent")
      .then((result) => setAllItems(result.items)).catch(() => undefined);
  }, []);

  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      const params = new URLSearchParams({ q: query, field, deadline, sort, category });
      setLoading(true);
      jsonRequest<SearchResult>(`/opportunities/api/list?${params}`)
        .then((result) => { if (active) { setItems(result.items); setTotal(result.total); setError(""); } })
        .catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : "공고를 불러오지 못했습니다."); })
        .finally(() => { if (active) setLoading(false); });
    }, 250);
    return () => { active = false; clearTimeout(timer); };
  }, [query, field, deadline, sort, category]);

  useEffect(() => {
    if (!selected) return;
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") setSelected(null); };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [selected]);

  const saved = useMemo(() => allItems.filter((item) => bookmarks.includes(item.id) && item.category === category), [allItems, bookmarks, category]);

  function chooseCategory(value: OpportunityCategory) {
    recommendationRequest.current += 1;
    setCategory(value);
    setField("all");
    setView("discover");
    setRecommendations([]);
    setRecommendationMode(null);
    setRecommending(false);
  }

  function toggleBookmark(id: string) {
    const next = bookmarks.includes(id) ? bookmarks.filter((value) => value !== id) : [...bookmarks, id];
    setBookmarks(next);
    try { localStorage.setItem(BOOKMARK_KEY, JSON.stringify(next)); } catch { /* Browser storage is optional. */ }
  }

  async function requestRecommendations(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const requestId = ++recommendationRequest.current;
    setRecommending(true); setError("");
    try {
      const result = await jsonRequest<RecommendationResult>("/opportunities/api/recommend", { major, grade, interests: interests.filter((value) => FIELDS[category].includes(value)), category });
      if (requestId === recommendationRequest.current) { setRecommendations(result.recommendations); setRecommendationMode(result.mode); setView("recommend"); }
    } catch (cause) { if (requestId === recommendationRequest.current) setError(cause instanceof Error ? cause.message : "추천을 만들지 못했습니다."); }
    finally { if (requestId === recommendationRequest.current) setRecommending(false); }
  }

  async function openDetail(item: Opportunity) {
    setSelected(item); setAnalysis(null); setAnalyzing(true);
    try {
      const result = await jsonRequest<{ analysis: Analysis }>("/opportunities/api/analyze", { id: item.id });
      setAnalysis(result.analysis);
    } catch { /* Keep the source preview available. */ }
    finally { setAnalyzing(false); }
  }

  const cards = (list: Opportunity[], reasons?: Record<string, string>) => <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{list.map((item) => <OpportunityCard key={item.id} item={item} reason={reasons?.[item.id]} saved={bookmarks.includes(item.id)} onSave={() => toggleBookmark(item.id)} onOpen={() => openDetail(item)} />)}</div>;

  return <main className="min-h-screen bg-[#f8f8f3] text-[#24372b]">
    <div className="border-b border-[#e4e9e0] bg-white"><div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8"><Link href="/" className="text-xl font-black tracking-[-.06em]">딸각<span className="text-[#ed8054]">.</span></Link><span className="text-xs font-semibold tracking-[.12em] text-[#8c998c]">OPPORTUNITY CURATION</span></div></div>
    <section className="relative overflow-hidden bg-[#183f2c] px-5 pb-14 pt-14 text-white sm:px-8 sm:pb-20 sm:pt-20"><div className="pointer-events-none absolute -right-16 -top-40 size-[440px] rounded-full border-[70px] border-[#ffffff0d]" /><div className="relative mx-auto max-w-7xl"><p className="mb-5 text-xs font-bold tracking-[.19em] text-[#b9dfaf]">FIND YOUR NEXT OPPORTUNITY</p><h1 className="max-w-3xl text-4xl font-extrabold leading-[1.22] tracking-[-.06em] sm:text-6xl">흩어진 기회를 모아,<br /><span className="text-[#bfe9a4]">나에게 맞는 도전으로.</span></h1><p className="mt-6 max-w-2xl text-sm leading-7 text-[#d2e1d1] sm:text-base">공모전과 장학 공지를 한곳에서 살펴보고, 전공과 관심 분야에 맞는 기회를 추천받으세요. 핵심 정보는 원문 근거와 함께 확인할 수 있어요.</p><div className="mt-8 flex flex-wrap gap-2 text-xs text-[#d5e6cf]"><span className="rounded-full border border-[#ffffff39] px-3 py-1.5">여러 출처 한눈에</span><span className="rounded-full border border-[#ffffff39] px-3 py-1.5">내 관심사로 추천</span><span className="rounded-full border border-[#ffffff39] px-3 py-1.5">원문으로 최종 확인</span></div></div></section>
    <div className="mx-auto max-w-7xl px-5 pb-24 sm:px-8">
      <div className="relative -mt-8 mb-5 flex flex-wrap gap-2 rounded-[24px] border border-[#e5eadd] bg-white p-3 shadow-[0_20px_50px_rgba(25,58,35,.10)]" role="group" aria-label="기회 유형">
        {(["contest", "scholarship"] as const).map((value) => <button type="button" key={value} onClick={() => chooseCategory(value)} aria-pressed={category === value} className={`flex-1 rounded-2xl px-5 py-4 text-left text-sm font-bold transition sm:text-base ${category === value ? "bg-[#2f7048] text-white" : "bg-[#f4f7f1] text-[#52705a] hover:bg-[#e8f0e3]"}`}>{CATEGORY_LABELS[value]}<span className="mt-1 block text-xs font-normal opacity-80">{value === "contest" ? "콘테스트코리아 공모전 목록" : "국민대학교 공식 장학공지"}</span></button>)}
      </div>
      <div className="mb-10 rounded-[24px] border border-[#e5eadd] bg-white p-5 shadow-[0_8px_28px_rgba(38,61,40,.04)] sm:p-7">
        <form onSubmit={requestRecommendations}>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-2"><div><p className="text-xs font-bold tracking-[.12em] text-[#6a8d5f]">PERSONALIZE</p><h2 className="mt-1 text-xl font-bold tracking-[-.04em]">내게 맞는 {CATEGORY_LABELS[category]} 추천받기</h2></div><p className="text-xs text-[#8b9688]">입력 정보는 추천 요청에만 사용해요</p></div>
          <div className="grid gap-3 sm:grid-cols-[1.4fr_.7fr_1fr]">
            <label className="text-sm font-semibold">전공<input value={major} onChange={(event) => setMajor(event.target.value)} maxLength={50} placeholder="예: 컴퓨터공학, 시각디자인" className="mt-2 w-full rounded-xl border border-[#dce5d9] bg-[#fcfdfa] px-4 py-3 font-normal outline-none focus:border-[#528b5c]" /></label>
            <label className="text-sm font-semibold">학년<select value={grade} onChange={(event) => setGrade(event.target.value)} className="mt-2 w-full rounded-xl border border-[#dce5d9] bg-[#fcfdfa] px-4 py-3 font-normal outline-none focus:border-[#528b5c]"><option value="">선택 안 함</option>{[1,2,3,4].map((value) => <option value={`${value}학년`} key={value}>{value}학년</option>)}<option value="대학원생">대학원생</option></select></label>
          </div>
          <fieldset className="mt-5"><legend className="text-sm font-semibold">관심 분야 <span className="font-normal text-[#8b9688]">· {CATEGORY_LABELS[category]}에서 최대 3개</span></legend>
            <div className="mt-3 flex flex-wrap gap-2">{FIELDS[category].map((value) => <button type="button" key={value} aria-pressed={interests.includes(value)} onClick={() => setInterests((current) => {
              const other = current.filter((item) => !FIELDS[category].includes(item));
              const selected = current.filter((item) => FIELDS[category].includes(item));
              return selected.includes(value) ? [...other, ...selected.filter((item) => item !== value)] : selected.length < 3 ? [...other, ...selected, value] : current;
            })} className={`rounded-full border px-3 py-2 text-xs font-semibold transition ${interests.includes(value) ? "border-[#36724a] bg-[#36724a] text-white" : "border-[#dbe5d8] bg-white text-[#637661] hover:border-[#80a487]"}`}>{value}</button>)}</div>
          </fieldset>
          <div className="mt-6 flex justify-end"><button type="submit" disabled={recommending} className="rounded-xl bg-[#ed8054] px-6 py-3 text-sm font-bold text-white hover:bg-[#db7046] disabled:opacity-60">{recommending ? "공고를 살펴보는 중…" : "맞춤 기회 추천받기 →"}</button></div>
        </form>
      </div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-[#e3e8df] pb-4"><div className="flex gap-5 text-sm font-bold">{([["discover", CATEGORY_LABELS[category]], ["recommend", "맞춤 추천"], ["saved", `관심 공고 ${saved.length}`]] as const).map(([value, label]) => <button type="button" key={value} onClick={() => setView(value)} className={view === value ? "text-[#2c7148]" : "text-[#94a094] hover:text-[#2c7148]"}>{label}</button>)}</div><span className="text-xs text-[#8c988c]">공개 공고 출처 · 최근 수집 항목</span></div>
      {error && <p role="alert" className="mb-5 rounded-xl border border-[#f2d0c1] bg-[#fff6f0] p-4 text-sm text-[#a55036]">{error}</p>}
      {view === "discover" && <><div className="mb-6 grid gap-3 sm:grid-cols-[1fr_180px_170px_150px]"><label className="sr-only" htmlFor="opportunity-search">공고 검색</label><input id="opportunity-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="공고명, 키워드, 주최기관 검색" className="rounded-xl border border-[#dce5d9] bg-white px-4 py-3 text-sm outline-none focus:border-[#528b5c]" /><select value={field} onChange={(event) => setField(event.target.value)} aria-label="분야 필터" className="rounded-xl border border-[#dce5d9] bg-white px-3 py-3 text-sm"><option value="all">전체 분야</option>{FIELDS[category].map((value) => <option key={value} value={value}>{value}</option>)}<option value="기타">세부 분야 미확인</option></select><select value={deadline} onChange={(event) => setDeadline(event.target.value)} aria-label="마감 필터" className="rounded-xl border border-[#dce5d9] bg-white px-3 py-3 text-sm"><option value="all">전체 마감</option><option value="known">마감 확인됨</option><option value="week">7일 이내</option></select><select value={sort} onChange={(event) => setSort(event.target.value)} aria-label="정렬" className="rounded-xl border border-[#dce5d9] bg-white px-3 py-3 text-sm"><option value="recent">최신 등록순</option><option value="deadline">마감일순</option></select></div><p className="mb-4 text-sm text-[#7d8b7d]">{loading ? "공고를 가져오는 중…" : `${total}개의 ${CATEGORY_LABELS[category]} 공고를 찾았어요`}</p>{cards(items)}{!loading && !items.length && !error && <p className="rounded-2xl bg-white p-10 text-center text-sm text-[#7d8b7d]">조건에 맞는 공고가 없어요. 필터를 바꿔 보세요.</p>}</>}
      {view === "recommend" && <><div className="mb-6 flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-bold tracking-[.12em] text-[#6a8d5f]">CURATED FOR YOU</p><h2 className="mt-1 text-2xl font-bold tracking-[-.04em]">내 관심사에 맞는 기회</h2></div>{recommendationMode && <span className="rounded-full bg-[#e9f2df] px-3 py-1.5 text-xs font-bold text-[#5a763c]">{recommendationMode === "ai" ? "Gemini 추천 · 원문 근거 확인" : "기본 추천 · Gemini 키 미설정 또는 연결 불가"}</span>}</div>{cards(recommendations.map((item) => item.opportunity), Object.fromEntries(recommendations.map((item) => [item.opportunity.id, item.reason])))}{!recommendations.length && <p className="rounded-2xl bg-white p-10 text-center text-sm text-[#7d8b7d]">전공 또는 관심 분야를 입력하고 추천 버튼을 눌러 주세요.</p>}</>}
      {view === "saved" && <><h2 className="mb-6 text-2xl font-bold tracking-[-.04em]">관심 공고</h2>{cards(saved)}{!saved.length && <p className="rounded-2xl bg-white p-10 text-center text-sm text-[#7d8b7d]">저장된 공고가 없어요. 마음에 드는 공고의 ♡ 버튼을 눌러 보세요.</p>}</>}
      <p className="mt-10 text-xs leading-6 text-[#89978a]">공고 내용·지원 자격·마감은 변경될 수 있습니다. 최종 확인은 반드시 원문 공지에서 해 주세요. 국민대학교 장학공지에는 국민대학교 학생에게만 적용되는 공고가 포함될 수 있습니다.</p>
    </div>
    {selected && <DetailPanel item={selected} analysis={analysis} loading={analyzing} onClose={() => setSelected(null)} />}
  </main>;
}
