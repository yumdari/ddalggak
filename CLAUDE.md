# 딸각 (ddalggak)

Next.js 앱 하나에 서비스 3개를 폴더로 나눠 개발한다. 구조와 작업 규칙은 `README.md`를 따른다.

## 규칙

- 서비스 코드는 `app/<서비스>/` 안에서만 작성한다 (`opportunities` · `course-plan` · `study`). 한 번에 한 서비스만 작업하고, 다른 서비스 폴더는 수정하거나 import하지 않는다.
- 공통 파일(`app/layout.tsx`, `app/globals.css`, `app/page.tsx`, `app/_registry.ts`, `components/`, `lib/`, `package.json`)은 임의로 고치지 않는다. 필요하면 먼저 물어본다.
- 서비스의 요구사항은 그 폴더의 `PRD.md`가 기준이다. PRD에 없는 기능을 추가하면 같은 작업에서 `PRD.md`도 고친다.
- API 키는 `.env.local`에만 둔다. `.env.example`에 실제 값을 쓰지 않는다.

@AGENTS.md
