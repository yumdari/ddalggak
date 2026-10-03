import assert from "node:assert/strict";
import test from "node:test";
import { classifyField, daysUntil, extractDeadline, rankOpportunities, searchOpportunities } from "./catalog.ts";

const sample = [
  { id: "a", title: "AI 데이터 공모전", source: "A", sourceUrl: "https://a.example/1", publishedAt: "2026-10-01", deadline: "2026-10-07", category: "contest", field: "AI·데이터", description: "컴퓨터공학 데이터 분석" },
  { id: "b", title: "생활비 장학금", source: "B", sourceUrl: "https://b.example/2", publishedAt: "2026-10-02", deadline: null, category: "scholarship", field: "생활비 지원", description: "시각디자인 전공" },
  { id: "c", title: "환경 공모전", source: "A", sourceUrl: "https://a.example/3", publishedAt: "2026-09-30", deadline: "2026-09-30", category: "contest", field: "사회·환경", description: "환경 아이디어" },
];

test("only a supported explicit deadline is used", () => {
  assert.equal(extractDeadline("신청 마감 2026.10.07"), "2026-10-07");
  assert.equal(extractDeadline("접수기간 2026.09.01 ~ 2026.10.08"), "2026-10-08");
  assert.equal(extractDeadline("발표일 2026.10.09"), null);
  assert.equal(extractDeadline("마감 2026.02.31"), null);
});

test("search combines sources and excludes a known expired item", () => {
  const now = new Date("2026-10-03T00:00:00+09:00");
  assert.deepEqual(searchOpportunities(sample, { now }).map((item) => item.id), ["b", "a"]);
  assert.deepEqual(searchOpportunities(sample, { now, sort: "deadline" }).map((item) => item.id), ["a", "b"]);
  assert.deepEqual(searchOpportunities(sample, { now, field: "AI·데이터", deadline: "week" }).map((item) => item.id), ["a"]);
  assert.deepEqual(searchOpportunities(sample, { now, query: "장학금" }).map((item) => item.id), ["b"]);
  assert.deepEqual(searchOpportunities(sample, { now, category: "contest" }).map((item) => item.id), ["a"]);
  assert.deepEqual(searchOpportunities(sample, { now, category: "scholarship", field: "생활비 지원" }).map((item) => item.id), ["b"]);
});

test("recommendation uses profile terms and explains the match", () => {
  const ranked = rankOpportunities(sample.slice(0, 2), { major: "컴퓨터공학", grade: "3학년", interests: ["AI·데이터"] });
  assert.equal(ranked[0].opportunity.id, "a");
  assert.match(ranked[0].reason, /컴퓨터공학/);
  assert.equal(classifyField("AI 데이터 해커톤"), "AI·데이터");
  assert.equal(classifyField("생활비 장학생 모집", "scholarship"), "생활비 지원");
  assert.equal(classifyField("외국인 유학생 장학금", "scholarship"), "국제·유학");
});

test("D-Day uses the Korean calendar date", () => {
  assert.equal(daysUntil("2026-10-03", new Date("2026-10-02T15:00:00Z")), 0);
  assert.equal(daysUntil("2026-10-04", new Date("2026-10-02T15:00:00Z")), 1);
  assert.equal(daysUntil(null), null);
});
