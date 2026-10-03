# 딸깍 요약 (pdf-summary)

강의자료 PDF를 올리면 요약 · 핵심 개념 · 퀴즈 · 플래시카드를 만들고, 자료 기반으로 질문할 수 있는 AI 튜터를 제공하는 서비스. 다른 팀원 서비스와 독립적으로 동작하며, 나중에 하나로 합친다.

## 실행

```bash
npm install
cp .env.example .env.local   # ANTHROPIC_API_KEY 입력
npm run dev                  # http://localhost:3000
```

API 키 없이 화면만 확인하려면 `.env.local`에 `MOCK_AI=1`.

## 구조

- `app/page.tsx` 랜딩 · `app/workspace/` 작업 화면
- `app/api/analyze` PDF → 요약/개념/퀴즈/카드 (Claude, 구조화 출력)
- `app/api/tutor` 자료 기반 질의응답
- `components/` 탭별 UI · `lib/` AI 호출·스키마·타입

## 제한 · 추후 구현

- PDF는 4MB 이하 (Vercel 요청 본문 한도)
- 로그인·저장 기록 없음 (새로고침하면 결과 사라짐)
- 마인드맵, 강의 녹음, 유튜브·PPT 입력은 미구현
