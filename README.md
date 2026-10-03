# 딸깍

대학생을 위한 공모전·장학금 맞춤 피드입니다. 공고를 여러 출처에서 수집해 검수하고, 관심 분야·학년·지역에 맞춰 보여줍니다. 신청은 공식 원문에서 진행합니다.

현재 첫 구현은 RSS/Atom 수집, 검수함, 맞춤 피드, 관심 공고를 제공합니다. [서비스 설계](docs/service-design.md)에 제품 범위와 다음 단계를 정리했습니다.

## 로컬 실행

Python 3.11 이상과 `uv`가 필요합니다.

```bash
uv venv .venv
uv pip install --python .venv/bin/python -e '.[dev]'
DDALGGAK_SECRET_KEY=local-change-this .venv/bin/flask --app ddalggak run --debug
```

브라우저에서 `http://127.0.0.1:5000`으로 접속합니다. SQLite DB는 기본적으로 `instance/ddalggak.sqlite`에 생성됩니다. 다른 경로를 쓰려면 `DDALGGAK_DATABASE`를 설정합니다. 실제 배포에는 충분히 긴 임의의 `DDALGGAK_SECRET_KEY`와 HTTPS가 필요합니다.

## 수집·검수 시작

회원가입 후 운영자가 해당 계정을 관리자로 지정합니다.

```bash
.venv/bin/flask --app ddalggak promote-admin admin@example.com
.venv/bin/flask --app ddalggak source add "가천대학교 장학공지" "https://www.gachon.ac.kr/bbs/kor/478/rssList.do?row=50"
.venv/bin/flask --app ddalggak collect
```

가천대학교 RSS는 수집 형식을 확인한 예시입니다. 특정 대학 전용 공고가 섞여 있으므로 사용자에게 맞는 게시 범위를 검토하세요. 실제 운영에는 출처별 이용 조건을 확인하고 주기 실행 작업에서 `collect`를 호출해야 합니다. 수집 항목은 즉시 추천에 노출되지 않고 관리자 검수함에 쌓입니다. 관리자 화면에서 원문을 보고 자격·마감 등을 확인해 게시하면 맞춤 피드에 나타납니다.

## 검증

```bash
.venv/bin/python -m unittest discover -s tests -v
.venv/bin/ruff check src tests
.venv/bin/ruff format --check src tests
```

## 프로젝트 구조

- `src/ddalggak/`: Flask 앱, 수집기, 추천 규칙, DB 스키마, 화면
- `docs/`: 서비스 설계
- `scripts/`: 이슈 브랜치·커밋·푸시 도구
- `tests/`: 서비스와 Git 작업 흐름 테스트

번호가 있는 GitHub 이슈는 깨끗한 작업 트리에서 `python3 scripts/issue.py start <issue> <slug>`로 시작하고, 검증 후 `python3 scripts/issue.py finish <issue> "<imperative subject>" <changed-path>...`로 커밋·푸시합니다. 푸시만 실패하면 `python3 scripts/issue.py push <issue>`로 재시도합니다. 번호가 없는 작업에는 이슈 번호를 붙이지 않습니다.
