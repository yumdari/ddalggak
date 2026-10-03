// 실행: node --test lib/gemini.test.mjs  (실제 API를 호출하지 않는다)
import assert from "node:assert/strict";
import { test } from "node:test";
import { ApiError } from "@google/genai";
import { geminiKeys, isDailyQuota, NoGeminiKeyError, withGeminiKey } from "./gemini.ts";

const err = (status, message) => new ApiError({ status, message });
const dailyQuota = () => err(429, "Quota exceeded ... GenerateRequestsPerDayPerProjectPerModel-FreeTier");

function useKeys(keys) {
  process.env.GEMINI_API_KEYS = keys;
  delete process.env.GEMINI_API_KEY;
}

test("키 목록: 쉼표로 나누고 공백·빈 값을 버린다", () => {
  useKeys(" a , b,, c ");
  assert.deepEqual(geminiKeys(), ["a", "b", "c"]);
});

test("키 목록: GEMINI_API_KEYS가 없으면 예전 GEMINI_API_KEY를 쓴다", () => {
  delete process.env.GEMINI_API_KEYS;
  process.env.GEMINI_API_KEY = "only";
  assert.deepEqual(geminiKeys(), ["only"]);
});

test("요청마다 다음 키로 돌려 쓴다", async () => {
  useKeys("a,b,c");
  const used = [];
  for (let i = 0; i < 6; i++) await withGeminiKey("rotate", async (_c, keyNo) => void used.push(keyNo));
  const counts = [1, 2, 3].map((n) => used.filter((u) => u === n).length);
  assert.deepEqual(counts, [2, 2, 2]);
  // 연속한 두 요청은 서로 다른 키에서 시작한다
  for (let i = 1; i < used.length; i++) assert.notEqual(used[i], used[i - 1]);
});

test("하루 한도가 찬 키는 건너뛰고 다음 키로 이어서 성공한다", async () => {
  useKeys("a,b,c");
  const tried = [];
  const run = async (_c, keyNo) => {
    tried.push(keyNo);
    if (keyNo !== 3) throw dailyQuota();
    return "ok";
  };

  // 시작 키가 무작위라서, 여러 번 호출하면 한도가 찬 1·2번 키를 각각 한 번씩은 거친다
  for (let i = 0; i < 9; i++) assert.equal(await withGeminiKey("daily", run), "ok");

  // 한도가 찬 키는 처음 걸린 뒤로는 다시 호출하지 않고, 3번 키가 계속 쓰인다
  assert.ok(tried.filter((n) => n === 1).length <= 1);
  assert.ok(tried.filter((n) => n === 2).length <= 1);
  assert.ok(tried.filter((n) => n === 3).length >= 9);
});

test("한도는 scope(모델)별로 따로 센다", async () => {
  useKeys("a,b");
  const blockedRun = async () => {
    throw dailyQuota();
  };
  await assert.rejects(withGeminiKey("model-x", blockedRun), isDailyQuota);
  // 다른 모델은 같은 키로도 쓸 수 있다
  assert.equal(await withGeminiKey("model-y", async () => "ok"), "ok");
});

test("모든 키가 하루 한도이면 한도 오류를 던지고, 이후에는 호출 없이 바로 던진다", async () => {
  useKeys("a,b");
  let calls = 0;
  const run = async () => {
    calls++;
    throw dailyQuota();
  };
  await assert.rejects(withGeminiKey("all-daily", run), isDailyQuota);
  assert.equal(calls, 2);
  await assert.rejects(withGeminiKey("all-daily", run), isDailyQuota);
  assert.equal(calls, 2); // 캐시된 한도 오류를 던져서 호출이 늘지 않는다
});

test("과부하(503)·분당 한도(429)는 다음 키로 넘긴다", async () => {
  useKeys("a,b");
  const run = async (_c, keyNo) => {
    if (keyNo === 1) throw err(503, "high demand");
    return `key${keyNo}`;
  };
  const results = new Set();
  for (let i = 0; i < 4; i++) results.add(await withGeminiKey("busy", run));
  assert.deepEqual([...results], ["key2"]);
});

test("모든 키가 과부하이면 마지막 오류를 던진다", async () => {
  useKeys("a,b");
  await assert.rejects(
    withGeminiKey("all-busy", async () => {
      throw err(503, "high demand");
    }),
    (e) => e instanceof ApiError && e.status === 503,
  );
});

test("잘못된 키(400 API key not valid, 403)는 건너뛴다", async () => {
  useKeys("bad,good");
  const run = async (_c, keyNo) => {
    if (keyNo === 1) throw err(400, "API key not valid. Please pass a valid API key.");
    return "ok";
  };
  for (let i = 0; i < 3; i++) assert.equal(await withGeminiKey("badkey", run), "ok");

  useKeys("denied,good");
  const run403 = async (_c, keyNo) => {
    if (keyNo === 1) throw err(403, "permission denied");
    return "ok";
  };
  for (let i = 0; i < 3; i++) assert.equal(await withGeminiKey("denied", run403), "ok");
});

test("키와 무관한 오류(404 모델 없음, 400 잘못된 요청)는 키를 바꾸지 않고 바로 던진다", async () => {
  useKeys("a,b,c");
  let calls = 0;
  await assert.rejects(
    withGeminiKey("notfound", async () => {
      calls++;
      throw err(404, "model not found");
    }),
    (e) => e instanceof ApiError && e.status === 404,
  );
  assert.equal(calls, 1);

  calls = 0;
  await assert.rejects(
    withGeminiKey("badrequest", async () => {
      calls++;
      throw err(400, "invalid argument: bad schema");
    }),
  );
  assert.equal(calls, 1);
});

test("ApiError가 아닌 오류도 그대로 던진다", async () => {
  useKeys("a,b");
  await assert.rejects(
    withGeminiKey("plain", async () => {
      throw new TypeError("boom");
    }),
    TypeError,
  );
});

test("키가 하나도 없으면 NoGeminiKeyError", async () => {
  delete process.env.GEMINI_API_KEYS;
  delete process.env.GEMINI_API_KEY;
  await assert.rejects(withGeminiKey("none", async () => "x"), NoGeminiKeyError);
});
