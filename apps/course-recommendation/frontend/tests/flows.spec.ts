import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("이메일", { exact: true }).fill("course-test@example.com");
  await page.getByLabel("비밀번호", { exact: true }).fill("test-password");
  await page.getByRole("button", { name: "로그인", exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
});

test("Persona A: recommendation, success lock, and failure recovery", async ({ page }) => {
  const runtimeErrors: string[] = [];
  page.on("pageerror", error => runtimeErrors.push(error.message));
  await page.goto("/");
  await page.getByRole("link").filter({ hasText: "수강신청·학사 일정 도우미" }).click();
  await expect(page).toHaveURL(/\/course-plan$/);
  await page.screenshot({ path: `test-results/landing-${test.info().project.name}.png`, fullPage: true });
  await page.getByRole("button", { name: "A. 임베디드 개발자" }).click();
  await expect(page.getByLabel("MBTI (선택)")).toBeVisible();
  for (let i = 0; i < 5; i++) await page.getByRole("button", { name: "다음 질문" }).click();
  await page.getByRole("button", { name: "내 추천 확인하기" }).click();
  await expect(page.getByRole("heading", { name: "이번 학기, 너의 다음 선택." })).toBeVisible();
  await expect(page.getByTestId("course-card").first()).toBeVisible();
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
  await page.getByRole("link").filter({ hasText: "수강신청·학사 일정 도우미" }).click();
  await expect(page).toHaveURL(/\/course-plan$/);
  await page.getByRole("button", { name: "B. 진로 탐색 새내기" }).click();
  for (let i = 0; i < 5; i++) await page.getByRole("button", { name: "다음 질문" }).click();
  await page.getByRole("button", { name: "내 추천 확인하기" }).click();
  await expect(page.getByRole("heading", { name: "이번 학기, 너의 다음 선택." })).toBeVisible();
  await expect(page.getByTestId("course-card").filter({ hasText: "전공기초" }).first()).toBeVisible();
  await expect(page.getByTestId("course-card").filter({ hasText: "교양" }).first()).toBeVisible();
});

test("all free days yields an honest empty result", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link").filter({ hasText: "수강신청·학사 일정 도우미" }).click();
  await expect(page).toHaveURL(/\/course-plan$/);
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
  await page.getByRole("link").filter({ hasText: "수강신청·학사 일정 도우미" }).click();
  await expect(page).toHaveURL(/\/course-plan$/);
  await page.getByRole("button", { name: "내 수강전략 만들기" }).click();
  for (let i = 0; i < 5; i++) await page.getByRole("button", { name: "다음 질문" }).click();
  await page.getByRole("button", { name: "내 추천 확인하기" }).click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText("추천 서버에 연결하지 못했습니다.");
  await expect(page.getByRole("button", { name: "내 추천 확인하기" })).toBeEnabled();
});

 test("return to main keeps shared styles intact", async ({ page }) => {
  await page.goto("/");
  const before = await page.locator("body").evaluate(el => ({ color: getComputedStyle(el).color, background: getComputedStyle(el).backgroundColor }));
  const service = page.getByRole("link").filter({ hasText: "수강신청·학사 일정 도우미" });
  await expect(service).toContainText("사용 가능");
  await expect(service).toContainText("시작하기");
  await service.click();
  await page.getByRole("link", { name: "전체 서비스" }).click();
  await expect(page).toHaveURL(/\/$/);
  const after = await page.locator("body").evaluate(el => ({ color: getComputedStyle(el).color, background: getComputedStyle(el).backgroundColor }));
  expect(after).toEqual(before);
});

test("simplified profile and syllabus upload feed the recommendation", async ({ page }) => {
  const requests: Record<string, unknown>[] = [];
  await page.route("**/course-plan/api/syllabi", route => route.request().postDataBuffer()?.includes(Buffer.from("bad.pdf")) ? route.fulfill({status:502, contentType:"application/json", body:JSON.stringify({detail:"분석 실패"})}) : route.fulfill({status:200, contentType:"application/json", body:JSON.stringify({courses:[{name:"업로드 테스트 과목",credits:null,professor:"김교수",category:"전공선택",syllabus:"마이크로컨트롤러 실습",schedule:[]}]})}));
  page.on("request", req=>{if(req.url().endsWith("/api/recommend")) requests.push(req.postDataJSON());});
  await page.goto("/course-plan");
  await page.getByRole("button",{name:"내 수강전략 만들기"}).click();
  const mbti=page.getByLabel("MBTI (선택)");
  expect(await mbti.locator("option").allTextContents()).toEqual(["선택 안 함","ISTJ","ISFJ","INFJ","INTJ","ISTP","ISFP","INFP","INTP","ESTP","ESFP","ENFP","ENTP","ESTJ","ESFJ","ENFJ","ENTJ"]);
  await mbti.selectOption("INTP"); await page.getByLabel("성별 (선택)").selectOption("여");
  await expect(page.getByText("이미 이수한 과목")).toHaveCount(0);
  await page.getByRole("button",{name:"다음 질문"}).click();
  await page.getByRole("button",{name:"Backend",exact:true}).click();
  await page.getByRole("button",{name:"Data",exact:true}).click();
  await expect(page.getByRole("button",{name:"Frontend",exact:true})).toBeDisabled();
  await expect(page.getByText("진로 확신도")).toHaveCount(0);
  await expect(page.getByText("관심 기술 / 분야 (선택)")).toHaveCount(0);
  await page.getByRole("button",{name:"다음 질문"}).click();
  await expect(page.getByRole("slider")).toHaveCount(0);
  await page.screenshot({path:`test-results/preferences-${test.info().project.name}.png`,fullPage:true});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
  await page.getByRole("group",{name:"암기",exact:true}).getByRole("radio",{name:"싫어요",exact:true}).check();
  await page.getByRole("button",{name:"다음 질문"}).click();
  await expect(page.getByText("되도록 피하고 싶은 요일")).toHaveCount(0);
  const credits=page.getByLabel("최대 신청학점"); await credits.fill(""); await expect(credits).toHaveValue(""); await credits.pressSequentially("2"); await expect(credits).toHaveValue("2"); await credits.fill("18");
  await page.getByRole("button",{name:"다음 질문"}).click();
  await page.getByLabel("수업계획서 PDF 업로드").setInputFiles([{name:"syllabus.pdf",mimeType:"application/pdf",buffer:Buffer.from("%PDF-1.4 test")},{name:"bad.pdf",mimeType:"application/pdf",buffer:Buffer.from("%PDF-1.4 test")}]);
  await expect(page.getByLabel("과목명",{exact:true})).toHaveValue("업로드 테스트 과목");
  await expect(page.getByRole("main").getByRole("alert")).toContainText("bad.pdf");
  await page.getByRole("button",{name:"확인 후 필수 과목 추가"}).click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText("과목명, 1~6학점");
  await page.getByLabel("학점",{exact:true}).fill("3");
  await page.getByRole("button",{name:"수업 시간 추가"}).click();
  await page.getByLabel("시작",{exact:true}).fill("18:00"); await page.getByLabel("종료",{exact:true}).fill("19:00");
  await page.getByRole("button",{name:"확인 후 필수 과목 추가"}).click();
  await page.getByRole("button",{name:"다음 질문"}).click();
  await page.getByRole("group",{name:"새로운 사람 만나기",exact:true}).getByRole("radio",{name:"좋아요",exact:true}).check();
  await page.getByRole("button",{name:"내 추천 확인하기"}).click();
  await expect(page.getByRole("heading",{name:"업로드 테스트 과목",exact:true})).toBeVisible();
  expect(requests[0]).toMatchObject({profile:{careers:["Embedded Software","Backend","Data"],mbti:"INTP",gender:"여",completed_ids:null,max_credits:18,learning:{memorization:0},campus:{social:100}},custom_courses:[{name:"업로드 테스트 과목"}]});
});

test("syllabus endpoint rejects invalid files before AI calls", async ({ request }) => {
  const invalid = await request.post("/course-plan/api/syllabi", {multipart:{file:{name:"fake.pdf",mimeType:"application/pdf",buffer:Buffer.from("not a PDF")}}});
  expect(invalid.status()).toBe(400);
  const wrongType = await request.post("/course-plan/api/syllabi", {multipart:{file:{name:"notes.txt",mimeType:"text/plain",buffer:Buffer.from("hello")}}});
  expect(wrongType.status()).toBe(400);
});
