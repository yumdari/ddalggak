# 딸각 (ddalggak)

Kookmin AI Builder Challenge 2026 · 7조

AI 기반 학업지원 정보중계 플랫폼. 서비스 3개를 각자 개발하고 하나의 앱으로 합친다. 요구사항 원본은 `(최종본) 7조딸깍_PRD.docx`이고, 서비스별 구현 기준은 각 서비스 폴더의 `PRD.md`다.

## 서비스와 담당 폴더

| # | 서비스 | 경로 | 폴더 |
|---|---|---|---|
| 01 | 기회 정보 큐레이션 | `/opportunities` | `app/opportunities/` |
| 02 | 수강신청·학사 일정 도우미 | `/course-plan` | `app/course-plan/` |
| 03 | 강의자료 PDF 요약·퀴즈 | `/study` | `app/study/` |

## 구조

```
app/
├── page.tsx              # 메인 (서비스 선택 화면)
├── _registry.ts          # 메인에 보일 서비스 목록
├── layout.tsx            # 공통 레이아웃·폰트
├── globals.css           # 공통 디자인 토큰
├── opportunities/        # ① 담당자의 폴더
├── course-plan/          # ② 담당자의 폴더
└── study/                # ③ 담당자의 폴더
components/               # 공통 컴포넌트 (여러 서비스가 쓰는 것만)
lib/                      # 공통 유틸·타입 (여러 서비스가 쓰는 것만)
```

서비스 폴더 하나의 안쪽 구성은 이렇다. 서비스 폴더가 곧 그 서비스의 전부다.

```
app/<서비스>/
├── page.tsx        # 서비스 첫 화면 (경로: /<서비스>)
├── meta.ts         # 메인 화면에 보일 이름·설명·기능 목록·상태
├── PRD.md          # 이 서비스의 요구사항 (기능이 바뀌면 같이 수정)
├── _components/    # 이 서비스 전용 컴포넌트
├── _lib/           # 이 서비스 전용 로직 (AI 호출, 타입 등)
└── api/<이름>/route.ts   # 이 서비스 API (경로: /<서비스>/api/<이름>)
```

`_`로 시작하는 폴더는 URL로 열리지 않는다. 화면 폴더(`app/study/workspace/` 등)는 자유롭게 추가한다.

## 작업 규칙

1. **내 서비스 폴더 안에서만 작업한다.** 코드, 컴포넌트, API, 스타일, 문서 모두 `app/<내 서비스>/` 안에 둔다.
2. **다른 서비스 폴더는 건드리지 않는다.** 다른 서비스 코드를 import하지도 않는다. 필요한 게 있으면 공통(`components/`, `lib/`)으로 올리자고 팀에 말한다.
3. **공통 파일을 고칠 때는 팀에 알린다.** 대상: `app/layout.tsx`, `app/globals.css`, `app/page.tsx`, `app/_registry.ts`, `components/`, `lib/`, `package.json`.
4. 서비스 전용 스타일은 서비스 폴더 안의 CSS 파일이나 Tailwind 클래스로 쓴다. `globals.css`에는 넣지 않는다.
5. **기능을 추가하거나 바꾸면 그 서비스의 `PRD.md`도 같이 고친다.** 제출용 PRD(docx)에 옮기는 것은 마지막에 한 번에 한다.
6. 개발을 시작하면 `page.tsx`의 `ComingSoon`을 지우고, `meta.ts`의 `status`를 `"ready"`로 바꾼다.
7. 의존성을 추가하면 `package.json`이 충돌하기 쉬우니 가능한 한 일찍, 짧게 커밋한다.
8. 커밋을 자주 한다. 대회는 커밋 시각으로 당일 작업인지 확인한다.

## 실행

```bash
npm install
cp .env.example .env.local   # 사용하는 서비스의 키를 입력
npm run dev                  # http://localhost:3000
```

- `.env.local`은 커밋되지 않는다. **키는 `.env.example`이 아니라 `.env.local`에 넣는다.** `.env.example`은 커밋되므로 키가 들어가면 공개된다.
- 서비스별 환경변수는 `.env.example`에 서비스 이름으로 구분해 적는다.
- 서비스별 설명은 각 폴더의 `README.md`를 본다.

## 배포

Vercel에 저장소를 그대로 연결한다 (루트가 Next.js 앱). 환경변수는 Vercel 설정에 따로 넣는다. 빌드는 `next build --webpack`으로 고정했다.
