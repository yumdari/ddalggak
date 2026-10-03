# 딸깍 — 나에게 좋은 강의

AI Builder Challenge 2026 수강전략 MVP. **성향 입력 → 과목 추천 → 수강 성공/실패 → 대체 조합**을 제공합니다.

프론트엔드는 메인 앱 `app/course-plan/`으로 통합되었습니다. `frontend/`는 기존 브라우저 테스트와 루트 앱 실행 위임 스크립트를 보관합니다. 메인 페이지의 수강신청 시작하기 또는 `/course-plan`에서 이용하세요.

## 구현 범위

- Next.js 16 / TypeScript / Tailwind CSS 4 → FastAPI / Pydantic → 결정론적 Python 추천엔진
- 가상 과목 25개, 이수과목·선수과목·공강일·학점·시간 충돌 검증
- 추천 점수와 세부 근거, Plan B/C/D 후보(유효한 후보가 있을 때), 수강 성공 과목 고정 및 반복 실패 복구
- 선택적 OpenAI Structured Output: 계산된 근거의 인덱스와 설명 톤만 선택하고, 서버가 검증된 근거를 문장으로 표시
- Key 부재/시간초과/거부/잘못된 AI 응답은 계산 근거 기반 템플릿 설명으로 복구
- 데스크톱/모바일 UI, Persona A/B 입력, 후보 부족 및 서버 장애 처리

대학 공식 과목·교수·수업계획서가 아닌 **가상 데모 데이터**입니다. 실제 수강신청을 실행하지 않습니다.

## 로컬 실행 (Windows PowerShell)

Node.js 20.9 이상(검증 환경 24), Python 3.12가 필요합니다.

```powershell
cd apps/course-recommendation
python -m venv .venv
.venv/Scripts/python.exe -m pip install -r backend/requirements-dev.lock.txt
npm --prefix ../.. ci
npm --prefix frontend ci
./scripts/dev.ps1
```

브라우저에서 http://localhost:3000 을 엽니다. 스크립트는 Backend를 숨겨진 프로세스로 실행하고 종료 시 정리합니다.

저장소 루트에서는 `./apps/course-recommendation/scripts/dev.ps1`로 실행할 수 있습니다. 앱 전용 `.venv`가 없으면 기존 저장소 루트 `.venv`를 재사용합니다. 가상환경은 절대경로에 의존하므로 이동하지 않았습니다.

개별 실행:

```powershell
# apps/course-recommendation, 터미널 1
.venv/Scripts/python.exe -m uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8000
# apps/course-recommendation, 터미널 2
npm --prefix frontend run dev
```

환경변수 예시는 `backend/.env.example`, 저장소 루트 `.env.example`을 참고하세요. Next.js의 `BACKEND_URL`은 저장소 루트 `.env.local`에 설정합니다. Backend의 `.env`는 Backend 폴더에서 실행하면 자동 로드됩니다. 루트 실행 시 루트 `.env` 또는 프로세스 환경변수로 설정하세요. Key 없이도 동작하는 대체 설명이 기본입니다.

## 검증

```powershell
.venv/Scripts/python.exe -m ruff check backend
Push-Location backend
../.venv/Scripts/python.exe -m pytest -q
Pop-Location
npm --prefix frontend run lint
npm --prefix frontend run typecheck
npm --prefix frontend run build
# Frontend/Backend 실행 상태에서:
Push-Location frontend
npx playwright install chromium
npm run test:e2e
Pop-Location
```

테스트는 제약조건, 반복 실패, 필수과목 부족, MBTI/성별 독립성, 무작위 프로필, AI 응답 validation/fallback과 주요 브라우저 흐름을 검증합니다. GitHub Actions도 같은 검사와 production 서버 E2E를 수행합니다.

## 배포: Render + Vercel

1. 코드를 GitHub에 push합니다.
2. Render에서 Blueprint 파일 경로를 `apps/course-recommendation/render.yaml`로 지정합니다. 배포할 작업 브랜치(`feat/sugang`)를 선택합니다. Backend root는 `apps/course-recommendation/backend`, health check는 `/health`입니다.
3. AI를 켜려면 Render 환경변수에 `OPENAI_API_KEY`를 넣습니다. 생략하면 템플릿 설명으로 동작합니다.
4. Render URL의 `/health`와 `/api/courses`를 확인합니다.
5. Vercel에서 이 저장소를 import하고 Root Directory를 **저장소 루트 (`.`)**, Framework를 **Next.js**로 선택합니다.
6. Vercel 서버 환경변수 **BACKEND_URL**에 Render URL(`https://…onrender.com`, `/api` 제외)을 입력합니다.
7. Vercel 배포 URL에서 Persona A/B와 수강 실패 복구를 검증합니다. 성공 과목 유지와 실패 과목 제외를 확인합니다.

Frontend는 같은 origin의 Next.js 서버 API proxy를 통해 Backend에 연결합니다. AI Secret을 클라이언트로 전달하지 않으며 `NEXT_PUBLIC_` 환경변수를 사용하지 않습니다. CORS 별도 설정 없이 서버 간 연결합니다. Render 무료 플랜의 첫 호출은 느릴 수 있어 데모 전 `/health`를 호출해 준비하세요.

**외부 계정 연결 전까지 실제 배포 URL 검증은 미완료입니다.** 코드와 설정이 준비된 것만으로 배포 완료를 주장하지 않습니다.

## 모델과 추천 규칙

- 진로 30% / 학습 25% / 평가 15% / 시간표 15% / Campus Life 10% / 학업계획 5%
- 성향 적합도는 0~100 입력과 과목 특성의 차이를 기반으로 계산
- 공강일은 hard constraint, 회피요일과 오전/오후 선호는 soft score
- 선수과목은 **이미 이수한 과목**으로만 충족(동시 신청으로 충족하지 않음)
- 지정 필수과목을 우선 배치하고 불가능하면 미충족을 알림; 조건을 위반하지 않음
- 수강 성공 과목은 고정, 나머지 기존 과목은 가능한 경우 유지
- 대체 후보는 나머지 과목과 비교해 검증한 **개별 교체 후보**. 여러 후보를 동시에 교체하려면 전체 재검증 필요
- 과목 태그 연관성 / 과목 구분 / 점수 순으로 대체 후보 정렬
- 진로 미정 또는 확신도 40 미만은 탐색 중심; 병역 계획 있음은 전공기초의 학업계획 점수에 가점

## 알려진 한계 / 후속 범위

- 점수순 greedy planner로, 모든 조합을 탐색하는 최적화 엔진은 아님
- 후보 부족 시 Plan B/C/D 일부가 없을 수 있음; 제한을 화면에 표시
- 학교/전공/학점/GPA는 프로필에 저장하지만 현재 단일 샘플 catalog를 학교별로 바꾸거나 성적 기반 자격을 추정하지 않음
- 관심 기술은 기록하며 현재 점수는 명시적 진로 태그에만 반영
- 병역 시작/복학 시점은 기록하며 정확한 학기 로드맵은 미구현
- 자연어 요구 분석, 수업계획서 LLM 분석, 주간 시간표 UI는 P1
- 로그인, DB, 저장, 장기 로드맵은 P2
- 과목은 하나의 데모 분반. 정원·실시간 신청현황·실제 졸업요건 데이터는 없음
- 프로필은 페이지 메모리에만 있으며 새로고침 시 초기화
- npm audit production 의존성은 취약점 0개. 개발용 eslint-config-next의 braces 계열 high 5개는 패치 미발행이며 추적 필요 ([공식 advisory](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm)). 사용자 입력을 glob 패턴으로 처리하지 않음

Structured Output 구현 참고: [OpenAI 공식 문서](https://developers.openai.com/api/docs/guides/structured-outputs).
