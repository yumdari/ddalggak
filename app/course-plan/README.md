# 수강 추천 서비스

메인 페이지에서 수강신청 서비스의 시작하기를 누르면 `/course-plan`으로 이동합니다. 화면·전용 스타일·타입·API 프록시는 이 폴더에 있으며 Python 추천엔진은 `apps/course-recommendation/backend`에 있습니다.

## 실행

저장소 루트에서 `npm install` 후 `./apps/course-recommendation/scripts/dev.ps1`을 실행하면 메인 앱과 Python 서버를 함께 시작합니다. Python 환경 설치는 기존 서비스 README를 참고하세요.

별도 실행 시 루트에서 `npm run dev`, 다른 터미널에서 `.venv/Scripts/python.exe -m uvicorn app.main:app --app-dir apps/course-recommendation/backend --host 127.0.0.1 --port 8000`을 실행합니다.

배포 시 Vercel Root Directory는 저장소 루트로 설정하고 `BACKEND_URL`에 Python 서버 주소를 지정합니다. API는 `/course-plan/api/courses`, `/course-plan/api/recommend`, `/course-plan/api/recommend/alternative`입니다. 서버가 없으면 오류와 재시도 UI를 표시합니다.
