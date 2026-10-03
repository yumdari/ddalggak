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

Vercel에 저장소를 그대로 연결한다 (루트가 Next.js 앱, 폴더 지정 없음). Production Branch는 `master`이고, 연결하면 `master`에 머지될 때마다 자동으로 다시 배포된다. 빌드 명령은 `npm run build`(= `next build --webpack`), Node는 22 이상을 쓴다.

**환경변수는 `.env.local`이 배포로 넘어가지 않으므로 Vercel 설정에 직접 넣는다.** 코드가 읽는 이름과 글자까지 같아야 하고, 바꾼 뒤에는 Redeploy해야 적용된다.

| 이름 | 쓰는 서비스 | 값 |
|---|---|---|
| `GEMINI_API_KEYS` | study, opportunities | Gemini 키를 쉼표로 이은 값. **모든 서비스가 이 변수 하나를 함께 쓴다** (`lib/gemini.ts`) |
| `OPPORTUNITIES_GEMINI_MODEL` | opportunities | `gemini-3.1-flash-lite` (12초 안에 응답하는 빠른 모델) |
| `BACKEND_URL` | course-plan | Render에 배포한 Python 추천 서버 주소(끝의 `/` 없이) |
| `AUTH_SECRET` | 로그인 | 로그인 쿠키 서명용 임의의 긴 문자열 (없으면 코드의 개발용 기본값을 쓴다) |

- Gemini 키는 요청마다 다음 키부터 돌려 쓰고, 한도(429)·과부하(503)·잘못된 키이면 같은 요청을 다음 키로 이어서 시도한다. 하루 한도가 찬 (모델, 키) 조합은 30분간 건너뛴다. 서로 다른 구글 프로젝트의 키여야 한도가 따로 계산된다. 예전 `GEMINI_API_KEY`(키 하나)도 읽는다.
- `course-plan`은 별도 Python 서버(`apps/course-recommendation/backend`)가 있어야 동작한다. Render에 먼저 배포하고(`apps/course-recommendation/render.yaml`), 그 주소를 `BACKEND_URL`에 넣는다.
- 적용 환경은 Production만 체크한다 (Preview에도 키를 넣으면 미리보기 배포가 무료 한도를 쓴다).
- `MOCK_AI`와 `NEXT_PUBLIC_`으로 시작하는 이름은 넣지 않는다.
- 새 서비스가 환경변수를 추가하면 Vercel에도 같이 넣는다. 현재 이름은 `grep -rhoE "process\.env\.[A-Z_]+" app lib --include=*.ts --include=*.tsx | sort -u`로 확인한다.

## 독립 수강 추천 앱

[수강 추천 서비스](apps/course-recommendation/README.md)는 `apps/course-recommendation/` 아래에 독립 앱으로 보존되어 있습니다.

- `frontend/`: 프로필 입력, 추천 결과, 수강 실패 복구 UI
- `backend/`: 결정론적 추천 API와 가상 과목 데이터
- `docs/`, `scripts/`, `render.yaml`: 검증 기록, 실행 스크립트, 배포 설정

메인 앱의 `/course-plan`은 현재 준비 중 화면입니다. 독립 추천 UI를 메인 경로에 실제 연결하는 작업은 후속 범위입니다.

루트의 `npm run dev`는 메인 앱을 실행합니다. 독립 앱은 별도 터미널에서 다음과 같이 실행할 수 있습니다.

```powershell
./apps/course-recommendation/scripts/dev.ps1 -FrontendPort 3001 -BackendPort 8001
```

독립 앱의 실행·배포·검증 방법은 앱 README를 참고하세요. 루트 TypeScript/ESLint 검사에서 `apps/`를 제외하고 독립 앱은 `.github/workflows/verify.yml`에서 별도로 검증합니다.
