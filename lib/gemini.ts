// 모든 서비스가 함께 쓰는 Gemini API 키 관리.
//
// - 키는 환경변수 GEMINI_API_KEYS에 쉼표로 여러 개 넣는다 (예: GEMINI_API_KEYS=키1,키2,키3).
//   예전 방식인 GEMINI_API_KEY(키 하나)도 그대로 읽는다.
// - 요청마다 다음 키부터 시작해서 돌려 쓰므로 사용량이 키마다 고르게 나뉜다.
// - 한도(429)·과부하(503)·잘못된 키(400/401/403)이면 같은 요청을 다음 키로 이어서 시도한다.
//   하루 한도가 찬 (scope, 키) 조합은 한동안 건너뛴다. 서버 인스턴스마다 따로 기억한다.
// - 한도는 구글 프로젝트 단위라, 서로 다른 프로젝트에서 만든 키여야 한도가 따로 계산된다.
import { ApiError, GoogleGenAI } from "@google/genai";

export class NoGeminiKeyError extends Error {
  constructor() {
    super("GEMINI_API_KEYS(또는 GEMINI_API_KEY)가 설정되지 않았어요.");
  }
}

export function geminiKeys(): string[] {
  return (process.env.GEMINI_API_KEYS ?? process.env.GEMINI_API_KEY ?? "")
    .split(",")
    .map((key) => key.trim())
    .filter(Boolean);
}

// 무료 티어의 하루 요청 한도(모델·프로젝트당)를 다 쓴 경우
export function isDailyQuota(e: unknown) {
  return e instanceof ApiError && e.status === 429 && /PerDay/i.test(e.message);
}

// 키 자체가 막힌 경우 (잘못된 키, 만료, 권한 없음)
function isBadKey(e: unknown) {
  if (!(e instanceof ApiError)) return false;
  return e.status === 401 || e.status === 403 || (e.status === 400 && /API key/i.test(e.message));
}

const QUOTA_RECHECK_MS = 30 * 60 * 1000;
const BAD_KEY_RECHECK_MS = 6 * 60 * 60 * 1000;
// `${scope}#${키 번호}` → 이 시각(ms)까지 건너뛰고, 모두 건너뛰게 되면 그때의 원래 오류를 그대로 던진다
const blocked = new Map<string, { until: number; error: ApiError }>();
const slot = (scope: string, index: number) => `${scope}#${index}`;

// 서버 인스턴스마다 시작 위치를 무작위로 잡아, 인스턴스가 여러 개여도 첫 번째 키에 몰리지 않게 한다
let cursor = Math.floor(Math.random() * 1_000_000);

const clients = new Map<string, GoogleGenAI>();
function clientFor(index: number, key: string, baseUrl?: string) {
  const id = `${index}|${key}|${baseUrl ?? ""}`;
  let client = clients.get(id);
  if (!client) {
    client = new GoogleGenAI({ apiKey: key, ...(baseUrl ? { httpOptions: { baseUrl } } : {}) });
    clients.set(id, client);
  }
  return client;
}

type Options = { baseUrl?: string };

/**
 * `run`을 다음 키로 실행하고, 키 때문에 실패하면 남은 키를 차례로 시도한다.
 * scope는 한도를 따로 세는 단위(보통 모델 이름)이다.
 * 키와 무관한 오류(없는 모델 404 등)는 키를 바꿔도 소용없으니 바로 던진다.
 */
export async function withGeminiKey<T>(
  scope: string,
  run: (client: GoogleGenAI, keyNo: number) => Promise<T>,
  options: Options = {},
): Promise<T> {
  const keys = geminiKeys();
  if (keys.length === 0) throw new NoGeminiKeyError();

  const start = cursor++ % keys.length;
  let lastError: unknown;
  let skippedError: ApiError | undefined;

  for (let i = 0; i < keys.length; i++) {
    const index = (start + i) % keys.length;
    const block = blocked.get(slot(scope, index));
    if (block && block.until > Date.now()) {
      skippedError = block.error;
      continue;
    }
    try {
      return await run(clientFor(index, keys[index], options.baseUrl), index + 1);
    } catch (e) {
      lastError = e;
      if (isDailyQuota(e)) {
        blocked.set(slot(scope, index), { until: Date.now() + QUOTA_RECHECK_MS, error: e as ApiError });
        console.warn(`[gemini] key #${index + 1} daily quota reached for ${scope}`);
      } else if (isBadKey(e)) {
        blocked.set(slot(scope, index), { until: Date.now() + BAD_KEY_RECHECK_MS, error: e as ApiError });
        console.warn(`[gemini] key #${index + 1} rejected (${(e as ApiError).status})`);
      } else if (e instanceof ApiError && (e.status === 429 || e.status === 503)) {
        console.warn(`[gemini] key #${index + 1} busy (${e.status}) for ${scope}`);
      } else {
        throw e;
      }
    }
  }

  // 모든 키를 건너뛰었거나 시도했는데 실패했다
  throw lastError ?? skippedError ?? new NoGeminiKeyError();
}
