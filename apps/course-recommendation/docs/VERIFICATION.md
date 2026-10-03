# P0 검증 기록

## 프로젝트 분리 (#7)

- 앱 소스/문서/스크립트/배포 설정을 `apps/course-recommendation/`으로 이동
- 공용 GitHub Actions, Render rootDir, Vercel 안내와 실행 경로 갱신
- 개발 지시서와 공용 Git 설정 유지, 기존 루트 Python 가상환경 재사용 지원
- 이동 후 Backend 46개 테스트, Ruff, Frontend lint/typecheck/production build 통과
- PowerShell 실행 스크립트 문법 검사 및 이동한 서버의 API proxy 응답 확인

검증 날짜: 2026-10-03 (Asia/Seoul)

## 로컬 결과

- Backend Ruff: passed
- Backend pytest: 46 passed
- Frontend ESLint: passed (0 warnings after PostCSS export cleanup)
- Frontend TypeScript: passed
- Next.js production build: passed
- Production 서버 기반 Playwright: desktop/mobile 총 8 passed
- Backend /health: status ok, 가상 과목 25개
- Next.js /api/courses proxy: 정상 Backend 응답
- 데스크톱·모바일 화면 캡처 확인, 추천 화면 가로 overflow 없음
- production npm audit: 0 vulnerabilities

## 검증한 사용자 흐름

- Persona A 입력 → 추천 → 수강 성공 → 다른 과목 수강 실패 → 성공 유지/실패 제외
- Persona B 입력 → 전공기초/교양 혼합 추천
- 모든 요일 공강 → 조건을 어기지 않는 빈 결과/제한 안내
- 추천 서버 오류 → 오류 메시지/입력 유지/재시도 가능
- 페이지 JavaScript runtime error 없음 (Persona A)

## 엔진/API 검증

- 결정론적 점수 및 가중치 합, 시간 경계(인접 수업)
- 선수과목/이미 이수한 과목/최대학점/공강 조건
- 추천 조합과 개별 대체 후보의 전체 시간표 충돌 재검증
- 반복 실패와 수강 성공 고정
- 필수과목 우선 배치, 미충족 상태 표시
- 무작위 25개 프로필 제약조건 검사
- MBTI/성별 변경이 점수에 영향을 주지 않음
- AI 정상 응답 및 timeout/잘못된 JSON/ID/근거/중복/미완료 응답 fallback

## 남은 검증과 제한

- Vercel/Render 인증·프로젝트 연결 전: 실제 배포 URL 미검증 (#3 Open)
- 실제 OpenAI 요청은 Key 부재로 미실행. AI 통합은 mock 응답과 fallback으로 검증
- Starlette TestClient의 httpx 사용 deprecation warning 1개 (검사는 통과)
- 개발 의존성 braces 계열 high 5개 (eslint-config-next 경유): 패치 미발행, production 취약점은 0개
- 샘플 데이터/greedy planner 범위와 P1/P2 미구현 사항은 README 참조
