"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Planner from "./Planner";
import Schedule from "./Schedule";

const TABS = [
  { id: "schedule", label: "학사 일정 알림" },
  { id: "plan", label: "플랜 A·B·C 만들기" },
] as const;
type TabId = (typeof TABS)[number]["id"];

export default function CoursePlan() {
  const router = useRouter();
  const pathname = usePathname();
  const tabParam = useSearchParams().get("tab");
  const tab: TabId = TABS.some((t) => t.id === tabParam) ? (tabParam as TabId) : "schedule";

  return (
    <main className="flex-1">
      <section className="bg-brand-glow">
        <div className="mx-auto max-w-6xl px-4 pt-12 sm:px-6">
          <p className="text-sm font-medium tracking-[0.25em] text-brand-blue">SERVICE 02</p>
          <h1 className="mt-2 text-3xl font-bold text-brand sm:text-4xl">수강신청·학사 일정 도우미</h1>
          <p className="mt-3 text-muted">학사 일정을 놓치지 않게 알려 주고, 원하는 과목이 마감되면 다음 플랜을 바로 안내해요.</p>
          <nav className="mt-8 flex gap-1 overflow-x-auto">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => router.replace(`${pathname}?tab=${t.id}`, { scroll: false })}
                className={`shrink-0 rounded-t-xl px-5 py-3 text-sm font-medium transition-colors ${
                  tab === t.id ? "bg-white text-brand" : "text-brand/70 hover:bg-white/50"
                }`}
              >
                {t.label}
              </button>
            ))}
          </nav>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">{tab === "schedule" ? <Schedule /> : <Planner />}</div>
    </main>
  );
}
