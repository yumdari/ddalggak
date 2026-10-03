import { getSession } from "@/lib/session";
import Landing from "./_home/Landing";
import ServiceHome from "./_home/ServiceHome";

// 로그인 전: 서비스 소개 / 로그인 후: 서비스 선택 화면
export default async function Home() {
  const session = await getSession();
  return session ? <ServiceHome session={session} /> : <Landing />;
}
