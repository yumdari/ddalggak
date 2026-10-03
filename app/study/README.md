# 03 강의자료 PDF 요약·퀴즈 (`/study`)

강의자료 PDF를 올리면 요약 · 핵심 개념 · 퀴즈 · 플래시카드를 만들고, 자료 기반으로 질문할 수 있는 AI 튜터를 제공한다. 요구사항은 [PRD.md](PRD.md).

## 구조

- `page.tsx` 서비스 소개 · `workspace/page.tsx` 작업 화면
- `api/analyze` PDF → 요약/개념/퀴즈/카드 (구조화 JSON 출력) · `api/tutor` 자료 기반 질의응답
- `_components/` 탭별 UI
- `_lib/ai.ts` 제공자 선택 · `_lib/providers/{gemini,claude}.ts` 호출 구현 · `_lib/prompts.ts` 프롬프트와 스키마

## 환경변수 (`.env.local`)

- `AI_PROVIDER`: `gemini`(기본) 또는 `claude`
- `GEMINI_API_KEY` / `GEMINI_MODEL`: 모델명은 AI Studio에서 쓸 수 있는 것으로 (기본 `gemini-3.8-flash`)
- `ANTHROPIC_API_KEY` / `ANTHROPIC_MODEL`: `AI_PROVIDER=claude`일 때
- `MOCK_AI=1`: AI를 호출하지 않고 샘플 데이터로 화면만 확인. **실제 키를 쓸 때는 반드시 지울 것.**

## 제한 · 추후 구현

- PDF는 4MB 이하 (Vercel 요청 본문 한도)
- 로그인·저장 기록 없음 (새로고침하면 결과 사라짐)
- 마인드맵, 강의 녹음, 유튜브·PPT 입력은 미구현
