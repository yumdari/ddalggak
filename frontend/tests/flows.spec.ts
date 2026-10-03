import { test, expect } from "@playwright/test";

test("Persona A: recommendation, success lock, and failure recovery", async ({ page }) => {
  const runtimeErrors: string[] = [];
  page.on("pageerror", error => runtimeErrors.push(error.message));
  await page.goto("/");
  await page.screenshot({ path: `test-results/landing-${test.info().project.name}.png`, fullPage: true });
  await page.getByRole("button", { name: "A. 임베디드 개발자" }).click();
  await expect(page.getByRole("button", { name: "C Programming", exact: true })).toBeVisible();
  for (let i = 0; i < 5; i++) await page.getByRole("button", { name: "다음 질문" }).click();
  await page.getByRole("button", { name: "내 추천 확인하기" }).click();
  await expect(page.getByRole("heading", { name: "이번 학기, 너의 다음 선택." })).toBeVisible();
  await expect(page.getByRole("heading", { name: "시스템프로그래밍", exact: true })).toBeVisible();
  const cards = page.getByTestId("course-card");
  const firstName = await cards.first().getByRole("heading").innerText();
  await cards.first().getByRole("button", { name: "수강 성공", exact: true }).click();
  await expect(page.getByRole("button", { name: "성공 해제" })).toBeVisible();
  const pending = cards.filter({ has: page.getByRole("button", { name: "수강 성공", exact: true }) }).first();
  const failedName = await pending.getByRole("heading").innerText();
  await pending.getByRole("button", { name: "수강 실패 → 재추천" }).click();
  await expect(page.getByRole("status")).toContainText("시간표를 다시 구성");
  await expect(page.getByRole("heading", { name: failedName, exact: true })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: firstName, exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "성공 해제" })).toBeVisible();
  await page.screenshot({ path: `test-results/persona-a-${test.info().project.name}.png`, fullPage: true });
  await page.screenshot({ path: `test-results/result-viewport-${test.info().project.name}.png` });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  expect(runtimeErrors).toEqual([]);
});

test("Persona B: general and foundation subjects", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "B. 진로 탐색 새내기" }).click();
  for (let i = 0; i < 5; i++) await page.getByRole("button", { name: "다음 질문" }).click();
  await page.getByRole("button", { name: "내 추천 확인하기" }).click();
  await expect(page.getByRole("heading", { name: "이번 학기, 너의 다음 선택." })).toBeVisible();
  await expect(page.getByTestId("course-card").filter({ hasText: "전공기초" }).first()).toBeVisible();
  await expect(page.getByTestId("course-card").filter({ hasText: "교양" }).first()).toBeVisible();
});

test("all free days yields an honest empty result", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "내 수강전략 만들기" }).click();
  for (let i = 0; i < 3; i++) await page.getByRole("button", { name: "다음 질문" }).click();
  for (const day of ["월", "화", "수", "목"]) await page.getByRole("button", { name: `${day} 요일`, exact: true }).first().click();
  await page.getByRole("button", { name: "다음 질문" }).click();
  await page.getByRole("button", { name: "다음 질문" }).click();
  await page.getByRole("button", { name: "내 추천 확인하기" }).click();
  await expect(page.getByRole("heading", { name: "지금 조건에 맞는 과목이 없어요." })).toBeVisible();
});

test("server errors keep profile available for retry", async ({ page }) => {
  await page.route("**/api/recommend", route => route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ detail: "추천 서버에 연결하지 못했습니다." }) }));
  await page.goto("/");
  await page.getByRole("button", { name: "내 수강전략 만들기" }).click();
  for (let i = 0; i < 5; i++) await page.getByRole("button", { name: "다음 질문" }).click();
  await page.getByRole("button", { name: "내 추천 확인하기" }).click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText("추천 서버에 연결하지 못했습니다.");
  await expect(page.getByRole("button", { name: "내 추천 확인하기" })).toBeEnabled();
});
