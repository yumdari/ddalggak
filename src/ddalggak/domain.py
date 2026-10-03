"""Opportunity input validation and display rules."""

from datetime import date, datetime, timezone
from urllib.parse import urlparse
from zoneinfo import ZoneInfo

SEOUL = ZoneInfo("Asia/Seoul")
KINDS = {"datetime", "date_only", "always_open", "unknown"}
TYPES = {"contest", "scholarship"}
EDITABLE = {
    "type",
    "title",
    "organizer",
    "summary",
    "eligibility_text",
    "benefits_text",
    "application_text",
    "region",
    "grade_min",
    "grade_max",
    "start_at",
    "deadline_date",
    "deadline_at",
    "deadline_kind",
    "source_url",
    "source_name",
    "tags",
}


class ValidationError(ValueError):
    pass


def now_utc():
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def parse_timestamp(value):
    try:
        parsed = datetime.fromisoformat(value)
    except (TypeError, ValueError) as error:
        raise ValidationError("날짜와 시각을 ISO 8601 형식으로 입력하세요.") from error
    if parsed.tzinfo is None or parsed.utcoffset() is None:
        raise ValidationError("시각에는 시간대가 필요합니다.")
    return parsed.astimezone(timezone.utc).isoformat(timespec="seconds")


def parse_date(value):
    try:
        return date.fromisoformat(value).isoformat()
    except (TypeError, ValueError) as error:
        raise ValidationError("날짜를 YYYY-MM-DD 형식으로 입력하세요.") from error


def valid_url(value):
    parts = urlparse(value)
    return parts.scheme in {"http", "https"} and bool(parts.hostname) and not parts.username


def normalize_opportunity(data):
    if not isinstance(data, dict):
        raise ValidationError("JSON 객체를 보내세요.")
    unknown = set(data) - EDITABLE
    if unknown:
        raise ValidationError(f"알 수 없는 필드: {', '.join(sorted(unknown))}")
    result = {}
    for name in (
        "type",
        "title",
        "organizer",
        "summary",
        "eligibility_text",
        "benefits_text",
        "application_text",
        "region",
        "deadline_kind",
        "source_url",
        "source_name",
    ):
        value = data.get(name) or ""
        if not isinstance(value, str):
            raise ValidationError(f"{name}은 문자열이어야 합니다.")
        result[name] = value.strip()
    if result["type"] not in TYPES:
        raise ValidationError("공고 유형을 선택하세요.")
    if result["deadline_kind"] not in KINDS:
        raise ValidationError("마감 유형을 선택하세요.")
    for name in ("title", "organizer", "eligibility_text", "application_text"):
        if not result[name]:
            raise ValidationError(f"{name}은 필수입니다.")
    if not valid_url(result["source_url"]):
        raise ValidationError("유효한 http/https 원문 URL을 입력하세요.")
    if not result["source_name"]:
        raise ValidationError("출처 이름은 필수입니다.")
    for name in ("grade_min", "grade_max"):
        value = data.get(name)
        if value in (None, ""):
            result[name] = None
        elif isinstance(value, int) and not isinstance(value, bool) and 1 <= value <= 6:
            result[name] = value
        else:
            raise ValidationError(f"{name}은 1~6 사이의 정수여야 합니다.")
    if result["grade_min"] and result["grade_max"]:
        if result["grade_min"] > result["grade_max"]:
            raise ValidationError("최소 학년은 최대 학년보다 클 수 없습니다.")
    result["start_at"] = parse_timestamp(data["start_at"]) if data.get("start_at") else None
    result["deadline_date"] = None
    result["deadline_at"] = None
    if result["deadline_kind"] == "datetime":
        result["deadline_at"] = parse_timestamp(data.get("deadline_at"))
    elif result["deadline_kind"] == "date_only":
        result["deadline_date"] = parse_date(data.get("deadline_date"))
    elif data.get("deadline_date") or data.get("deadline_at"):
        raise ValidationError("상시·미정 공고에는 마감일을 저장할 수 없습니다.")
    tags = data.get("tags", [])
    if not isinstance(tags, list) or any(not isinstance(tag, str) for tag in tags):
        raise ValidationError("tags는 문자열 목록이어야 합니다.")
    result["tags"] = sorted({tag.strip() for tag in tags if tag.strip()})
    if len(result["tags"]) > 10:
        raise ValidationError("분야 태그는 최대 10개입니다.")
    return result


def deadline_status(row, current=None):
    current = current or datetime.now(timezone.utc)
    kind = row["deadline_kind"]
    if kind == "always_open":
        return "상시"
    if kind == "unknown":
        return "미정"
    if kind == "date_only":
        return (
            "마감"
            if date.fromisoformat(row["deadline_date"]) < current.astimezone(SEOUL).date()
            else "모집 중"
        )
    return "마감" if datetime.fromisoformat(row["deadline_at"]) < current else "모집 중"


def deadline_label(row):
    kind = row["deadline_kind"]
    if kind == "always_open":
        return "상시 모집"
    if kind == "unknown":
        return "마감 미정"
    if kind == "date_only":
        return f"{row['deadline_date']} · 마감일만 확인됨"
    local = datetime.fromisoformat(row["deadline_at"]).astimezone(SEOUL)
    return local.strftime("%Y-%m-%d %H:%M KST")
