// 로그인 세션. 회원 DB가 아직 없어서 서명한 쿠키 하나로 로그인 상태만 유지한다.
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE = "ddalggak_session";
const MAX_AGE = 60 * 60 * 24 * 7; // 7일
const SECRET = process.env.AUTH_SECRET || "ddalggak-dev-secret";

export type Session = { email: string; name: string };

function sign(payload: string) {
  return createHmac("sha256", SECRET).update(payload).digest("base64url");
}

function encode(session: Session) {
  const payload = Buffer.from(JSON.stringify(session)).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

function decode(value: string): Session | null {
  const [payload, signature] = value.split(".");
  if (!payload || !signature) return null;
  const expected = Buffer.from(sign(payload));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString());
  } catch {
    return null;
  }
}

export async function getSession() {
  const value = (await cookies()).get(COOKIE)?.value;
  return value ? decode(value) : null;
}

// Server Action 또는 Route Handler 안에서만 호출한다.
export async function createSession(session: Session) {
  (await cookies()).set(COOKIE, encode(session), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: MAX_AGE,
    path: "/",
  });
}

export async function deleteSession() {
  (await cookies()).delete(COOKIE);
}
