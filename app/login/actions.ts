"use server";

import { redirect } from "next/navigation";
import { createSession, deleteSession } from "@/lib/session";

export type LoginState = { error?: string; email?: string } | undefined;

// 회원 DB 연결 전까지는 형식만 맞으면 로그인시키는 데모 로그인이다.
export async function login(_: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "이메일 형식을 확인해 주세요.", email };
  }
  if (password.length < 4) {
    return { error: "비밀번호는 4자 이상 입력해 주세요.", email };
  }

  await createSession({ email, name: email.split("@")[0] });
  redirect("/");
}

export async function logout() {
  await deleteSession();
  redirect("/");
}
