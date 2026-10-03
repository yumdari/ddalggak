"use client";

import { useState, useSyncExternalStore } from "react";
import { useStoredState } from "@/lib/useStoredState";
import { dateFromOffset, dday, events, type AcademicEvent } from "../_lib/data";

const noopSubscribe = () => () => {};

// FR-05: 학사 일정을 D-7, D-1, 당일에 알려 준다
const ALERT_POINTS = [7, 1, 0];
const SUBS_KEY = "ddalggak:course-plan:alerts";

type Alert = { ev: AcademicEvent; point: number };

function todaysAlerts(subs: string[]): Alert[] {
  return events
    .filter((ev) => subs.includes(ev.id) && ALERT_POINTS.includes(ev.startOffset))
    .map((ev) => ({ ev, point: ev.startOffset }));
}

const alertText = ({ ev, point }: Alert) =>
  point === 0 ? `오늘부터 ${ev.title}이(가) 시작돼요.` : `${ev.title}까지 ${point}일 남았어요. (${dateFromOffset(ev.startOffset)} 시작)`;

export default function Schedule() {
  const [subs, setSubs] = useStoredState<string[]>(SUBS_KEY, events.map((e) => e.id));
  const [, rerender] = useState(0);
  const perm = useSyncExternalStore(
    noopSubscribe,
    () => (typeof Notification === "undefined" ? "unsupported" : Notification.permission),
    () => "default" as const,
  );

  const toggle = (id: string) => setSubs((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const alerts = todaysAlerts(subs);
  const upcoming = events.filter((e) => e.endOffset >= 0).sort((a, b) => a.startOffset - b.startOffset);
  const past = events.filter((e) => e.endOffset < 0);

  async function enableBrowser() {
    if (typeof Notification === "undefined") return;
    const p = await Notification.requestPermission();
    rerender((n) => n + 1);
    if (p === "granted") {
      for (const a of alerts) new Notification("딸깍 학사 일정 알림", { body: alertText(a) });
    }
  }

  return (
    <div className="space-y-10">
      <section className="rounded-2xl bg-brand p-6 text-white sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-white/70">오늘의 알림 · {dateFromOffset(0)}</p>
            <p className="mt-1 text-xl font-bold">{alerts.length > 0 ? `알림 ${alerts.length}건이 있어요` : "오늘은 알림이 없어요"}</p>
          </div>
          {perm !== "unsupported" && (
            <button
              onClick={enableBrowser}
              disabled={perm === "denied"}
              className="rounded-full bg-white px-5 py-2.5 text-sm font-medium text-brand hover:bg-brand-tint disabled:opacity-50"
            >
              {perm === "granted" ? "브라우저 알림 다시 보내기" : perm === "denied" ? "브라우저 알림이 차단됨" : "브라우저 알림 켜기"}
            </button>
          )}
        </div>
        {alerts.length > 0 && (
          <ul className="mt-5 space-y-2">
            {alerts.map((a) => (
              <li key={a.ev.id} className="flex items-start gap-3 rounded-xl bg-white/10 px-4 py-3 text-sm">
                <span className="shrink-0 rounded-full bg-brand-light px-2.5 py-0.5 text-xs font-bold">{a.point === 0 ? "당일" : `D-${a.point}`}</span>
                <span>
                  {alertText(a)}
                  <span className="mt-0.5 block text-xs text-white/60">출처: {a.ev.source}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-xl font-bold text-brand">다가오는 학사 일정</h2>
        <div className="mt-4 space-y-3">
          {upcoming.map((ev) => (
            <EventRow key={ev.id} ev={ev} subscribed={subs.includes(ev.id)} onToggle={() => toggle(ev.id)} />
          ))}
        </div>
      </section>

      {past.length > 0 && (
        <section>
          <h2 className="text-sm font-bold text-muted">지난 일정</h2>
          <div className="mt-3 space-y-2 opacity-60">
            {past.map((ev) => (
              <div key={ev.id} className="flex justify-between rounded-xl border border-line px-4 py-3 text-sm">
                <span>{ev.title}</span>
                <span className="text-muted">{dateFromOffset(ev.startOffset)} ~ {dateFromOffset(ev.endOffset)}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <p className="rounded-xl bg-brand-tint px-4 py-3 text-xs text-brand">
        학사 일정은 학교 공지를 확인해 입력한 정보예요. 날짜가 바뀔 수 있으니 최종 확인은 원문 공지에서 해 주세요. (현재는 샘플 일정이에요.)
      </p>
    </div>
  );
}

function EventRow({ ev, subscribed, onToggle }: { ev: AcademicEvent; subscribed: boolean; onToggle: () => void }) {
  const ongoing = ev.startOffset <= 0 && ev.endOffset >= 0;
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-line p-5 sm:flex-row sm:items-center">
      <div className={`flex h-16 w-20 shrink-0 flex-col items-center justify-center rounded-xl ${ongoing ? "bg-brand text-white" : ev.startOffset <= 7 ? "bg-bad-soft text-bad" : "bg-brand-tint text-brand"}`}>
        <span className="text-lg font-bold">{ongoing ? "진행 중" : dday(ev.startOffset)}</span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-soft px-2.5 py-0.5 text-xs text-muted">{ev.type}</span>
          <span className="font-bold text-brand">{ev.title}</span>
        </div>
        <p className="mt-1 text-sm text-muted">
          {dateFromOffset(ev.startOffset)} ~ {dateFromOffset(ev.endOffset)} · {ev.note}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
          {ALERT_POINTS.map((p) => {
            const at = ev.startOffset - p; // 알림이 울리는 날 (오늘 기준)
            const state = at < 0 ? "지남" : at === 0 ? "오늘" : `${at}일 뒤`;
            return (
              <span key={p} className={`rounded-full px-2 py-0.5 ${at === 0 ? "bg-brand-light text-white" : at < 0 ? "bg-soft text-muted line-through" : "border border-line text-muted"}`}>
                {p === 0 ? "당일" : `D-${p}`} · {state}
              </span>
            );
          })}
          <span className="text-muted">· 출처: {ev.source}</span>
        </div>
      </div>
      <label className="flex shrink-0 cursor-pointer items-center gap-2 text-sm">
        <span className="text-muted">알림</span>
        <button
          type="button"
          role="switch"
          aria-checked={subscribed}
          aria-label={`${ev.title} 알림`}
          onClick={onToggle}
          className={`relative h-6 w-11 rounded-full transition-colors ${subscribed ? "bg-brand" : "bg-line"}`}
        >
          <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${subscribed ? "left-[22px]" : "left-0.5"}`} />
        </button>
      </label>
    </div>
  );
}
