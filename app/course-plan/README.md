# 수강 추천 서비스

메인 페이지에서 수강신청 서비스의 시작하기를 누르면 `/course-plan`으로 이동합니다. 화면·전용 스타일·타입·API 프록시는 이 폴더에 있으며 Python 추천엔진은 `apps/course-recommendation/backend`에 있습니다.

## 실행

저장소 루트에서 `npm install` 후 `./apps/course-recommendation/scripts/dev.ps1`을 실행하면 메인 앱과 Python 서버를 함께 시작합니다. Python 환경 설치는 기존 서비스 README를 참고하세요.

별도 실행 시 루트에서 `npm run dev`, 다른 터미널에서 `.venv/Scripts/python.exe -m uvicorn app.main:app --app-dir apps/course-recommendation/backend --host 127.0.0.1 --port 8000`을 실행합니다.

배포 시 Vercel Root Directory는 저장소 루트로 설정하고 `BACKEND_URL`에 Python 서버 주소를 지정합니다. API는 `/course-plan/api/courses`, `/course-plan/api/recommend`, `/course-plan/api/recommend/alternative`입니다. 서버가 없으면 오류와 재시도 UI를 표시합니다.

## 수업계획서 업로드

대학생활 계획 단계에서 여러 수업계획서 PDF를 업로드합니다. 각 파일은 3MB 이하, 한 번에 10개입니다. 파일은 Gemini API로 전송되며 서버에 저장하지 않습니다. 추출된 과목명, 학점, 교수, 구분, 요일/시간을 확인한 뒤 필수 과목으로 추가하세요. 누락된 학점이나 시간은 직접 보완해야 합니다. 확정된 과목만 Python 추천 요청의 `custom_courses`로 전달하며 최대 10개입니다.

Vercel/루트 `.env.local`에 `GEMINI_API_KEYS` (쉼표로 여러 키를 지정할 수 있으며 인증/한도/일시 오류 시 다음 키로 재시도)가 필요합니다. 모델은 `COURSE_PLAN_GEMINI_MODEL`, `GEMINI_MODEL`, 기본 `gemini-2.5-flash` 순으로 선택합니다. Gemini 장애/미설정은 파일별 오류로 표시됩니다. HWP/DOCX는 PDF로 변환해 업로드하세요.

진로 3개 중 하나라도 과목 태그에 해당하면 진로 적합도에 반영합니다. 이수과목을 입력받지 않으므로 선수과목과 재수강 여부는 검증하지 않습니다. 기존 API의 명시적 이수과목 리스트는 호환성을 유지합니다. 업로드 과목은 추출하지 않은 평가 비중과 성향을 사실로 표시하지 않으며, 시간표 외 적합도는 중립값입니다.
