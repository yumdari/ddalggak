# 03 강의자료 PDF 요약·퀴즈 (`/study`)

강의자료 PDF를 올리면 요약 · 핵심 개념 · 퀴즈 · 플래시카드를 만들고, 자료 기반으로 질문할 수 있는 AI 튜터를 제공한다. 요구사항은 [PRD.md](PRD.md).

## 구조

- `page.tsx` 서비스 소개 · `workspace/page.tsx` 작업 화면 (내 문서 목록 → 업로드 → 문서 보기)
- `api/analyze` PDF → 요약(쪽수 근거 포함) · `api/generate` 핵심 개념/플래시카드(요청 시 생성) · `api/quiz` 퀴즈(문항 수·힌트) · `api/tutor` 자료 기반 질의응답 (모두 구조화 JSON 출력)
- `_components/` 화면 (`Workspace` 흐름 제어, `Library` 목록, `Upload`, `DocView` 문서 보기와 탭, `DocRail` 왼쪽 아이콘 레일, `DocSidebar` 문서 이동, `Tutor` AI 튜터)
- `_lib/store.ts` 브라우저 저장(IndexedDB) · `_lib/thumbnail.ts` PDF 첫 페이지 미리보기(pdf.js)
- `_lib/ai.ts` 제공자 선택 · `_lib/providers/{gemini,claude}.ts` 호출 구현 · `_lib/prompts.ts` 프롬프트와 스키마

## 환경변수 (`.env.local`)

- `AI_PROVIDER`: `gemini`(기본) 또는 `claude`
- `GEMINI_API_KEY` / `GEMINI_MODEL`: 모델명은 AI Studio에서 쓸 수 있는 것으로 (기본 `gemini-3.5-flash`)
- `GEMINI_API_KEYS`: 키를 쉼표로 여러 개 넣으면 한도·과부하 시 순서대로 넘어간다 (모델 → 키 순서로 시도, 하루 한도가 찬 조합은 30분간 건너뜀). 서로 다른 구글 프로젝트의 키여야 한도가 따로 계산된다. 키는 `.env.local`/배포 환경변수에만 넣는다.
- `GEMINI_FALLBACK_MODELS`: 기본 모델이 붐비면(503·429) 순서대로 넘어갈 대체 모델 (쉼표로 구분, 기본 `gemini-3.8-flash,gemini-3.6-flash,gemini-3.1-flash-lite`)
- `ANTHROPIC_API_KEY` / `ANTHROPIC_MODEL`: `AI_PROVIDER=claude`일 때
- `MOCK_AI=1`: AI를 호출하지 않고 샘플 데이터로 화면만 확인. **실제 키를 쓸 때는 반드시 지울 것.**

## 무료 티어 주의

Gemini 무료 키는 **모델마다 하루 20요청**이다 (요약·개념·카드·퀴즈·튜터 질문이 각각 1요청). 한도를 넘으면 429가 나고 대체 모델로 넘어가며, 모두 소진되면 "오늘 사용할 수 있는 AI 사용량을 모두 썼어요"가 나온다. 개발 중 화면 확인은 `MOCK_AI=1`로 하고, 시연 전에는 결제(과금)를 켠 키나 Claude 키를 쓰는 것을 권한다.

## 샘플

`public/study/sample.pdf`는 직접 만든 5쪽짜리 강의자료이고, 작업 화면의 "샘플 강의자료로 체험하기"에서 쓴다.

## 제한 · 추후 구현

- PDF는 3MB 이하 (`_lib/limits.ts`). Vercel 요청 본문 한도(4.5MB) 때문이며, 퀴즈·개념·카드·튜터는 PDF를 base64(약 1.33배)로 보내므로 3MB 파일이 약 4MB 요청이 된다
- 문서는 이 브라우저에만 저장된다 (서버 저장·로그인 없음, 브라우저 데이터를 지우면 사라짐)
- 마인드맵, 강의 녹음, 유튜브·PPT 입력은 미구현
