import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import Logo from "@/components/Logo";
import { getSession } from "@/lib/session";
import LoginForm from "./_components/LoginForm";

export const metadata: Metadata = { title: "로그인 - 딸깍" };

export default async function LoginPage() {
  if (await getSession()) redirect("/");

  return (
    <div className="flex flex-1 flex-col bg-[radial-gradient(circle_at_0%_0%,#cfe7f7_0,transparent_35%),radial-gradient(circle_at_100%_100%,#a9d6f2_0,transparent_45%)] bg-[#f4f6f8]">
      <header className="px-5 py-4 sm:px-8">
        <Logo />
      </header>

      <main className="flex flex-1 items-center justify-center px-4 pb-16">
        <div className="w-full max-w-sm rounded-3xl bg-white p-7 shadow-[0_20px_60px_-20px_rgba(0,56,102,0.25)] sm:p-9">
          <div className="flex w-fit overflow-hidden rounded-full text-xs font-medium">
            <span className="bg-brand-sky px-3 py-1 text-white">딸깍</span>
            <span className="bg-brand-navy px-3 py-1 text-white">로그인</span>
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-brand-ink">다시 만나서 반가워요</h1>
          <p className="mt-1.5 text-sm text-muted">로그인하면 내 맞춤 서비스로 바로 이동해요.</p>

          <div className="mt-7">
            <LoginForm />
          </div>

          <p className="mt-6 rounded-xl bg-soft px-3 py-2.5 text-xs leading-relaxed text-muted">
            데모 버전이에요. 이메일 형식과 4자 이상의 비밀번호면 로그인돼요. 학교 포털 계정은 입력하지 마세요.
          </p>
        </div>
      </main>

      <footer className="pb-8 text-center text-xs text-muted">
        <Link href="/" className="hover:text-brand-navy">
          ← 서비스 소개로 돌아가기
        </Link>
      </footer>
    </div>
  );
}
