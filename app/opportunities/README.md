# 기회 정보 큐레이션

`/opportunities`에서 두 대학의 공개 RSS를 통합해 검색하고, 전공·관심 분야로 공고를 추천받습니다. 공고를 열면 Gemini 요약을 요청하며, 결과마다 실제 RSS 본문에서 확인한 근거 문구를 표시합니다.

`service.ts`가 이 서비스의 상위 진입점입니다. RSS 수집(`_lib/feeds.ts`), 검색·추천 규칙(`_lib/catalog.ts`), Gemini 요약·추천(`_lib/ai.ts`)을 묶어 세 API 라우트에 제공합니다. 화면은 `_components/Workspace.tsx`에서 관리합니다.

## 환경변수

루트 `.env.local`에 아래 값을 설정합니다. 실제 키는 커밋하지 않습니다.

```dotenv
GEMINI_API_KEY=your-server-key
OPPORTUNITIES_GEMINI_MODEL=gemini-2.5-flash
```

키가 없어도 통합 목록·검색·기본 추천·원문 미리보기는 동작합니다. 화면은 Gemini 사용 여부를 표시합니다. RSS 수집에 별도 키는 필요하지 않습니다. 같은 `GEMINI_API_KEY`를 쓰는 학습 서비스와 모델 설정은 별개입니다.

## 검증

루트에서 다음을 실행합니다.

```bash
node --experimental-strip-types --test app/opportunities/_lib/catalog.test.mjs
npx eslint app/opportunities
npx tsc --noEmit
npm run build
```

## 데이터 범위

- [인천대학교 대외활동 및 공모전](https://itcenter.inu.ac.kr/shinbang/2542/subview.do)
- [가천대학교 장학공지](https://www.gachon.ac.kr/kor/1146/subview.do)

서버는 출처 RSS를 읽고 URL을 기준으로 중복을 제거하며 10분간 메모리에 보관합니다. 수집 실패 시 이전 캐시가 있으면 유지합니다. 마감일은 원문에 연도와 마감 근거가 모두 있는 경우에만 추출합니다. 공고 원문과 게시물의 이용 조건은 운영 전에 확인해야 합니다.

현재 브랜치는 서비스 폴더 밖의 공통 의존성을 바꾸지 않도록 요청받아 MySQL 연동을 포함하지 않습니다. 따라서 서버 재시작 후 캐시는 다시 수집하며 관심 공고는 해당 브라우저에만 남습니다.
