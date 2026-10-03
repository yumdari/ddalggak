"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useStoredState } from "@/lib/useStoredState";
import {
  CATEGORIES,
  FIELDS,
  MAJORS,
  SKILLS,
  dateFromOffset,
  dday,
  gradeLabel,
  opportunities,
  type Category,
  type Field,
  type Opportunity,
} from "../_lib/data";
import { recommend, type Profile, type RecommendResult } from "../_lib/recommend";

const TABS = [
  { id: "search", label: "공모전 통합 검색" },
  { id: "recommend", label: "AI 맞춤 추천" },
  { id: "saved", label: "관심 공모전" },
] as const;
type TabId = (typeof TABS)[number]["id"];

const SAVED_KEY = "ddalggak:opportunities:saved";

export default function Opportunities() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const tabParam = params.get("tab");
  const tab: TabId = TABS.some((t) => t.id === tabParam) ? (tabParam as TabId) : "search";
  const setTab = (id: TabId) => router.replace(`${pathname}?tab=${id}`, { scroll: false });

  const [saved, setSaved] = useStoredState<string[]>(SAVED_KEY, []);
  const [selected, setSelected] = useState<Opportunity | null>(null);

  const toggleSave = (id: string) => setSaved((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const cardProps = { saved, onSave: toggleSave, onOpen: setSelected };

  return (
    <main className="flex-1">
      <section className="bg-brand-glow">
        <div className="mx-auto max-w-6xl px-4 pb-0 pt-12 sm:px-6">
          <p className="text-sm font-medium tracking-[0.25em] text-brand-blue">SERVICE 01</p>
          <h1 className="mt-2 text-3xl font-bold text-brand sm:text-4xl">기회 정보 큐레이션</h1>
          <p className="mt-3 text-muted">흩어진 공모전·대외활동·해커톤·장학금을 한곳에서 찾고, 내게 맞는 기회를 추천받으세요.</p>
          <nav className="mt-8 flex gap-1 overflow-x-auto">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`shrink-0 rounded-t-xl px-5 py-3 text-sm font-medium transition-colors ${
                  tab === t.id ? "bg-white text-brand" : "text-brand/70 hover:bg-white/50"
                }`}
              >
                {t.label}
                {t.id === "saved" && saved.length > 0 && (
                  <span className="ml-1.5 rounded-full bg-brand px-1.5 py-0.5 text-[11px] text-white">{saved.length}</span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        {tab === "search" && <SearchTab {...cardProps} />}
        {tab === "recommend" && <RecommendTab {...cardProps} />}
        {tab === "saved" && <SavedTab {...cardProps} />}
      </div>

      {selected && (
        <DetailModal
          item={selected}
          saved={saved.includes(selected.id)}
          onSave={() => toggleSave(selected.id)}
          onClose={() => setSelected(null)}
        />
      )}
    </main>
  );
}

type CardProps = { saved: string[]; onSave: (id: string) => void; onOpen: (o: Opportunity) => void };

/* ---------- FR-01 통합 검색 ---------- */

function SearchTab(props: CardProps) {
  const [q, setQ] = useState("");
  const [cats, setCats] = useState<Category[]>([]);
  const [field, setField] = useState<Field | "">("");
  const [within, setWithin] = useState<number>(0); // 0 = 전체, n = n일 이내 마감
  const [showClosed, setShowClosed] = useState(false);
  const [sort, setSort] = useState<"deadline" | "recent">("deadline");

  const results = useMemo(() => {
    const kw = q.trim().toLowerCase();
    return opportunities
      .filter((o) => showClosed || o.deadlineOffset >= 0)
      .filter((o) => cats.length === 0 || cats.includes(o.category))
      .filter((o) => !field || o.fields.includes(field))
      .filter((o) => !within || (o.deadlineOffset >= 0 && o.deadlineOffset <= within))
      .filter(
        (o) =>
          !kw ||
          [o.title, o.host, o.eligibility, o.notice, ...o.fields].some((s) => s.toLowerCase().includes(kw)),
      )
      .sort((a, b) => {
        if (sort === "recent") return b.startOffset - a.startOffset;
        // 마감된 공고는 항상 뒤로
        const ac = a.deadlineOffset < 0 ? 1 : 0;
        const bc = b.deadlineOffset < 0 ? 1 : 0;
        return ac - bc || a.deadlineOffset - b.deadlineOffset;
      });
  }, [q, cats, field, within, showClosed, sort]);

  const sources = new Set(opportunities.map((o) => o.source)).size;

  return (
    <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
      <aside className="space-y-6">
        <div>
          <label htmlFor="q" className="text-sm font-bold text-brand">키워드</label>
          <input
            id="q"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="예: AI, 디자인, 서포터즈"
            className="mt-2 w-full rounded-xl border border-line px-4 py-2.5 text-sm outline-none focus:border-brand-light"
          />
        </div>
        <FilterGroup title="유형">
          {CATEGORIES.map((c) => (
            <Chip key={c} active={cats.includes(c)} onClick={() => setCats((v) => (v.includes(c) ? v.filter((x) => x !== c) : [...v, c]))}>
              {c}
            </Chip>
          ))}
        </FilterGroup>
        <FilterGroup title="분야">
          <Chip active={!field} onClick={() => setField("")}>전체</Chip>
          {FIELDS.map((f) => (
            <Chip key={f} active={field === f} onClick={() => setField(f)}>{f}</Chip>
          ))}
        </FilterGroup>
        <FilterGroup title="마감일">
          {[
            [0, "전체"],
            [7, "7일 이내"],
            [14, "14일 이내"],
            [30, "30일 이내"],
          ].map(([v, l]) => (
            <Chip key={v} active={within === v} onClick={() => setWithin(v as number)}>{l}</Chip>
          ))}
        </FilterGroup>
        <label className="flex items-center gap-2 text-sm text-muted">
          <input type="checkbox" checked={showClosed} onChange={(e) => setShowClosed(e.target.checked)} className="accent-brand" />
          마감된 공고도 보기
        </label>
      </aside>

      <section>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted">
            <span className="font-bold text-brand">{sources}개 출처</span>에서 모은 공고 중{" "}
            <span className="font-bold text-brand">{results.length}건</span>
          </p>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
            className="rounded-lg border border-line px-3 py-2 text-sm"
            aria-label="정렬"
          >
            <option value="deadline">마감 임박순</option>
            <option value="recent">최근 등록순</option>
          </select>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {results.map((o) => (
            <OppCard key={o.id} item={o} {...props} />
          ))}
        </div>
        {results.length === 0 && <Empty text="조건에 맞는 공고가 없어요. 필터를 줄여 보세요." />}
      </section>
    </div>
  );
}

/* ---------- FR-03 맞춤 추천 ---------- */

function RecommendTab(props: CardProps) {
  const [profile, setProfile] = useState<Profile>({ major: "", grade: 3, fields: [], skills: [] });
  const [result, setResult] = useState<RecommendResult | null>(null);
  const [loading, setLoading] = useState(false);

  const canRun = profile.major !== "" && profile.fields.length > 0;

  function run() {
    setLoading(true);
    setResult(null);
    // 분석하는 동안의 짧은 대기. 실제 AI 연동 시 API 호출로 대체
    setTimeout(() => {
      setResult(recommend(opportunities, profile));
      setLoading(false);
    }, 700);
  }

  const toggle = <K extends "fields" | "skills">(key: K, v: Profile[K][number]) =>
    setProfile((p) => {
      const arr = p[key] as string[];
      return { ...p, [key]: arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v] };
    });

  return (
    <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
      <aside className="h-fit space-y-6 rounded-2xl border border-line p-6">
        <p className="font-bold text-brand">내 프로필</p>
        <div>
          <label htmlFor="major" className="text-sm font-medium">전공 계열</label>
          <select
            id="major"
            value={profile.major}
            onChange={(e) => setProfile({ ...profile, major: e.target.value as Profile["major"] })}
            className="mt-2 w-full rounded-xl border border-line px-3 py-2.5 text-sm"
          >
            <option value="">선택하세요</option>
            {MAJORS.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
        </div>
        <FilterGroup title="학년">
          {[1, 2, 3, 4, 5].map((g) => (
            <Chip key={g} active={profile.grade === g} onClick={() => setProfile({ ...profile, grade: g })}>
              {gradeLabel(g)}
            </Chip>
          ))}
        </FilterGroup>
        <FilterGroup title="관심 분야 (1개 이상)">
          {FIELDS.map((f) => (
            <Chip key={f} active={profile.fields.includes(f)} onClick={() => toggle("fields", f)}>{f}</Chip>
          ))}
        </FilterGroup>
        <FilterGroup title="보유 기술">
          {SKILLS.map((s) => (
            <Chip key={s} active={profile.skills.includes(s)} onClick={() => toggle("skills", s)}>{s}</Chip>
          ))}
        </FilterGroup>
        <button
          onClick={run}
          disabled={!canRun || loading}
          className="w-full rounded-full bg-brand py-3 text-sm font-medium text-white hover:bg-brand-mid disabled:cursor-not-allowed disabled:opacity-40"
        >
          AI에게 공모전 추천받기
        </button>
        {!canRun && <p className="-mt-3 text-center text-xs text-muted">전공 계열과 관심 분야를 골라 주세요.</p>}
      </aside>

      <section>
        {loading && (
          <div className="flex flex-col items-center rounded-2xl border border-line py-20">
            <div className="h-9 w-9 animate-spin rounded-full border-4 border-line border-t-brand" />
            <p className="mt-5 font-medium text-brand">공고를 분석하고 있어요</p>
          </div>
        )}
        {!loading && !result && (
          <div className="bg-brand-glow flex flex-col items-center rounded-2xl px-6 py-20 text-center">
            <p className="text-lg font-bold text-brand">프로필을 입력하면 맞춤 공모전을 찾아 드려요</p>
            <p className="mt-2 text-sm text-muted">전공·학년·관심 분야·보유 기술로 지원 자격과 적합도를 분석합니다.</p>
          </div>
        )}
        {result && (
          <>
            <p className="text-sm text-muted">
              추천 <span className="font-bold text-brand">{result.list.length}건</span>
              {result.excluded.length > 0 && ` · 지원 자격이 맞지 않아 ${result.excluded.length}건 제외`}
            </p>
            <div className="mt-4 space-y-3">
              {result.list.map(({ item, score, reasons }, i) => (
                <div key={item.id} className="rounded-2xl border border-line p-5">
                  <div className="flex items-start gap-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs text-muted">{item.category} · {item.host}</span>
                        <DdayBadge offset={item.deadlineOffset} />
                      </div>
                      <button onClick={() => props.onOpen(item)} className="mt-1 text-left text-lg font-bold text-brand hover:underline">
                        {item.title}
                      </button>
                      <div className="mt-2 flex items-center gap-3">
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-soft">
                          <div className="h-full rounded-full bg-gradient-to-r from-brand-light to-brand" style={{ width: `${score}%` }} />
                        </div>
                        <span className="text-sm font-bold text-brand">적합도 {score}%</span>
                      </div>
                      <ul className="mt-3 space-y-1 text-sm">
                        {reasons.map((r) => (
                          <li key={r} className="flex gap-2">
                            <span className="text-brand-light">✓</span>
                            {r}
                          </li>
                        ))}
                      </ul>
                      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
                        <span>상금/혜택: {item.prize}</span>
                        <span>접수: {dateFromOffset(item.startOffset)} ~ {dateFromOffset(item.deadlineOffset)}</span>
                      </div>
                    </div>
                    <SaveButton active={props.saved.includes(item.id)} onClick={() => props.onSave(item.id)} />
                  </div>
                </div>
              ))}
            </div>
            {result.list.length === 0 && <Empty text="조건에 맞는 공고가 없어요. 관심 분야를 더 골라 보세요." />}
          </>
        )}
      </section>
    </div>
  );
}

/* ---------- FR-04 관심 공모전 ---------- */

function SavedTab(props: CardProps) {
  const items = opportunities
    .filter((o) => props.saved.includes(o.id))
    .sort((a, b) => a.deadlineOffset - b.deadlineOffset);

  if (items.length === 0) return <Empty text="아직 저장한 공모전이 없어요. 검색이나 추천 결과에서 ☆를 눌러 저장하세요." />;

  return (
    <div className="space-y-3">
      {items.map((o) => {
        const total = Math.max(1, o.deadlineOffset - o.startOffset);
        const passed = Math.min(100, Math.max(0, (-o.startOffset / total) * 100));
        return (
          <div key={o.id} className="flex items-center gap-4 rounded-2xl border border-line p-5">
            <div className={`flex h-16 w-20 shrink-0 flex-col items-center justify-center rounded-xl ${o.deadlineOffset < 0 ? "bg-soft text-muted" : o.deadlineOffset <= 3 ? "bg-bad-soft text-bad" : "bg-brand-tint text-brand"}`}>
              <span className="text-lg font-bold">{dday(o.deadlineOffset)}</span>
              <span className="text-[11px]">{dateFromOffset(o.deadlineOffset)} 마감</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted">{o.category} · {o.host}</p>
              <button onClick={() => props.onOpen(o)} className="truncate text-left font-bold text-brand hover:underline">{o.title}</button>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-soft">
                <div className="h-full bg-brand-light" style={{ width: `${o.deadlineOffset < 0 ? 100 : passed}%` }} />
              </div>
            </div>
            <SaveButton active onClick={() => props.onSave(o.id)} />
          </div>
        );
      })}
    </div>
  );
}

/* ---------- FR-02 상세·AI 요약 ---------- */

function DetailModal({ item, saved, onSave, onClose }: { item: Opportunity; saved: boolean; onSave: () => void; onClose: () => void }) {
  const [showNotice, setShowNotice] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const rows: [string, React.ReactNode][] = [
    ["지원 자격", item.eligibility],
    ["지원 학년", item.grades.length ? item.grades.map(gradeLabel).join(", ") : "제한 없음"],
    ["분야", item.fields.join(", ")],
    ["상금/혜택", item.prize],
    ["접수 기간", `${dateFromOffset(item.startOffset)} ~ ${dateFromOffset(item.deadlineOffset)} (${dday(item.deadlineOffset)})`],
    ["일정", item.schedule],
    ["제출물", item.submission.join(", ")],
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-brand-deep/50 sm:items-center sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={item.title}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90dvh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-white sm:rounded-3xl"
      >
        <div className="bg-brand-glow p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-brand px-2.5 py-0.5 text-xs text-white">{item.category}</span>
                <DdayBadge offset={item.deadlineOffset} />
              </div>
              <h2 className="mt-3 text-2xl font-bold text-brand">{item.title}</h2>
              <p className="mt-1 text-sm text-muted">{item.host} · 출처: {item.source}</p>
            </div>
            <button onClick={onClose} className="text-2xl leading-none text-muted hover:text-brand" aria-label="닫기">×</button>
          </div>
        </div>
        <div className="p-6 sm:p-8">
          <p className="flex items-center gap-2 text-sm font-bold text-brand">
            <span className="rounded-full bg-brand-light px-2.5 py-0.5 text-xs text-white">AI 요약</span>
            핵심만 정리했어요
          </p>
          <dl className="mt-4 divide-y divide-line rounded-2xl border border-line">
            {rows.map(([k, v]) => (
              <div key={k} className="grid grid-cols-[90px_1fr] gap-3 px-4 py-3 text-sm">
                <dt className="text-muted">{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>

          <button onClick={() => setShowNotice((v) => !v)} className="mt-5 text-sm font-medium text-brand-blue hover:underline">
            {showNotice ? "원문 공고 접기 ▲" : "원문 공고 보기 ▼"}
          </button>
          {showNotice && <p className="mt-3 rounded-xl bg-soft p-4 text-sm leading-relaxed text-muted">{item.notice}</p>}

          <p className="mt-5 rounded-xl bg-brand-tint px-4 py-3 text-xs text-brand">
            AI 요약은 참고용이에요. 지원 전 최종 확인은 원문 공지에서 해 주세요. (현재는 샘플 데이터라 외부 원문 링크가 연결되지 않아요.)
          </p>

          <div className="mt-6 flex gap-2">
            <button
              onClick={onSave}
              className={`flex-1 rounded-full py-3 text-sm font-medium ${saved ? "border border-brand text-brand" : "bg-brand text-white hover:bg-brand-mid"}`}
            >
              {saved ? "★ 관심 공모전에서 빼기" : "☆ 관심 공모전으로 저장"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- 공통 조각 ---------- */

function OppCard({ item, saved, onSave, onOpen }: { item: Opportunity } & CardProps) {
  const closed = item.deadlineOffset < 0;
  return (
    <div className={`flex flex-col rounded-2xl border border-line p-5 transition-shadow hover:shadow-md ${closed ? "opacity-60" : ""}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="rounded-full bg-brand-tint px-2.5 py-0.5 text-xs font-medium text-brand">{item.category}</span>
          <DdayBadge offset={item.deadlineOffset} />
        </div>
        <SaveButton active={saved.includes(item.id)} onClick={() => onSave(item.id)} />
      </div>
      <button onClick={() => onOpen(item)} className="mt-3 text-left font-bold leading-snug text-brand hover:underline">
        {item.title}
      </button>
      <p className="mt-1 text-xs text-muted">{item.host} · {item.source}</p>
      <p className="mt-3 line-clamp-2 flex-1 text-sm text-muted">{item.eligibility}</p>
      <div className="mt-4 flex items-center justify-between text-xs">
        <span className="text-muted">~ {dateFromOffset(item.deadlineOffset)}</span>
        <button onClick={() => onOpen(item)} className="font-medium text-brand-blue hover:underline">AI 요약 보기 →</button>
      </div>
    </div>
  );
}

function DdayBadge({ offset }: { offset: number }) {
  const cls = offset < 0 ? "bg-soft text-muted" : offset <= 3 ? "bg-bad-soft text-bad" : "bg-brand-tint text-brand-blue";
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${cls}`}>{dday(offset)}</span>;
}

function SaveButton({ active, onClick }: { active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 text-xl leading-none ${active ? "text-brand-bright" : "text-line hover:text-brand-light"}`}
      aria-label={active ? "관심 공모전에서 빼기" : "관심 공모전으로 저장"}
      aria-pressed={active}
    >
      {active ? "★" : "☆"}
    </button>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-sm font-bold text-brand">{title}</p>
      <div className="mt-2 flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
        active ? "bg-brand text-white" : "bg-soft text-muted hover:text-brand"
      }`}
    >
      {children}
    </button>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="rounded-2xl border border-dashed border-line px-6 py-16 text-center text-sm text-muted">{text}</p>;
}
