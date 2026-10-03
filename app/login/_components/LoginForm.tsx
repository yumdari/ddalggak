"use client";

import { useActionState } from "react";
import { login } from "../actions";

export default function LoginForm() {
  const [state, action, pending] = useActionState(login, undefined);

  return (
    <form action={action} className="space-y-4">
      <div>
        <label htmlFor="email" className="text-sm font-medium">
          이메일
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          defaultValue={state?.email}
          placeholder="student@kookmin.ac.kr"
          className="mt-1.5 w-full rounded-xl border border-line bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-sky focus:ring-2 focus:ring-brand-sky/30"
        />
      </div>
      <div>
        <label htmlFor="password" className="text-sm font-medium">
          비밀번호
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          placeholder="4자 이상"
          className="mt-1.5 w-full rounded-xl border border-line bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-sky focus:ring-2 focus:ring-brand-sky/30"
        />
      </div>

      {state?.error && (
        <p role="alert" className="rounded-lg bg-bad-soft px-3 py-2 text-sm text-bad">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-brand-navy py-3 text-sm font-bold text-white transition hover:bg-brand-deep disabled:opacity-60"
      >
        {pending ? "로그인 중…" : "로그인"}
      </button>
    </form>
  );
}
