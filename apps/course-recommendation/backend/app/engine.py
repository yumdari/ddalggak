"""Deterministic MVP: hard constraints first, scored greedy selection second.

The greedy planner is intentionally small. It produces feasible plans, not a
globally optimal timetable. Alternatives are validated against the whole plan.
"""

import json
from functools import lru_cache
from pathlib import Path

from .models import Course, Profile, RecommendRequest

WEIGHTS = {"career": 0.30, "learning": 0.25, "assessment": 0.15, "schedule": 0.15, "campus": 0.10, "academic": 0.05}
LABELS = {
    "career": "진로",
    "learning": "학습성향",
    "assessment": "평가방식",
    "schedule": "시간표",
    "campus": "대학생활",
    "academic": "학업계획",
}


@lru_cache
def load_courses() -> tuple[Course, ...]:
    data = json.loads((Path(__file__).parent.parent / "data/courses.json").read_text(encoding="utf-8"))
    courses = tuple(Course.model_validate(row) for row in data)
    if len({c.course_id for c in courses}) != len(courses):
        raise ValueError("과목 ID 중복")
    return courses


def conflicts(a: Course, b: Course) -> bool:
    return any(x.day == y.day and x.start < y.end and y.start < x.end for x in a.schedule for y in b.schedule)


def exclusion(course: Course, profile: Profile, failed: set[str]) -> str | None:
    if course.course_id in failed:
        return "수강 실패로 제외"
    if course.course_id in (profile.completed_ids or []):
        return "이미 이수한 과목"
    missing = set(course.prerequisites) - set(profile.completed_ids or []) if profile.completed_ids is not None else set()
    if missing:
        return "선수과목 미이수: " + ", ".join(sorted(missing))
    if any(m.day in profile.free_days for m in course.schedule):
        return "공강일과 겹침"
    return None


def compatible(candidate: Course, selected: list[Course], max_credits: int) -> bool:
    return (
        candidate.course_id not in {c.course_id for c in selected}
        and sum(c.credits for c in selected) + candidate.credits <= max_credits
        and not any(conflicts(candidate, c) for c in selected)
    )


def similarity(user: dict, course: dict, keys: list[str]) -> float:
    return sum(100 - abs(user[k] - course[k]) for k in keys) / len(keys)


def score(course: Course, p: Profile) -> dict:
    user, style = p.learning.model_dump(), course.learning_style.model_dump()
    campus = p.campus.model_dump()
    careers = p.careers if p.careers is not None else [p.career]
    exploratory = not careers or careers == ["아직 모름"] or (p.careers is None and p.career_confidence < 40)
    career = 100 if set(careers) & set(course.career_tags) else 65 if course.category == "전공기초" else 35
    if exploratory:
        career = 75 + 0.25 * course.campus_life.exploration
    # Free days are hard constraints; preferred/avoided days are soft signals.
    per_meeting = []
    for m in course.schedule:
        value = 85
        if m.day in p.preferred_days:
            value += 15
        if m.day in p.avoided_days:
            value -= 45
        if p.time_preference != "any":
            match = m.end <= 720 if p.time_preference == "morning" else m.start >= 720
            value += 15 if match else -35
        per_meeting.append(max(0, min(100, value)))
    academic = max(30, 100 - 20 * abs(course.recommended_year - p.year))
    if p.military_status == "planned" and course.category == "전공기초":
        academic = min(100, academic + 10)
    parts = {
        "career": career,
        "learning": similarity(user, style, ["memorization", "problem_solving", "practice", "project"]),
        "assessment": similarity(user, style, ["essay", "team_project", "presentation", "exam"]),
        "schedule": sum(per_meeting) / len(per_meeting),
        "campus": similarity(campus, course.campus_life.model_dump(), list(campus)),
        "academic": academic,
    }
    if course.course_id.startswith("upload-"):
        # No evidence about course traits: keep those components neutral.
        parts = {k: v if k == "schedule" else 50 for k, v in parts.items()}
    parts = {k: round(v, 1) for k, v in parts.items()}
    return {"total": round(sum(parts[k] * w for k, w in WEIGHTS.items()), 1), "parts": parts}


def facts(course: Course, p: Profile, scored: dict) -> list[str]:
    strongest = sorted(scored["parts"], key=lambda k: (-scored["parts"][k], k))[:2]
    result = [f"{LABELS[k]} 적합도 {scored['parts'][k]:g}점" for k in strongest]
    matching = set(p.careers if p.careers is not None else [p.career]) & set(course.career_tags)
    if matching:
        result.append(f"{', '.join(sorted(matching))} 연관 과목")
    if p.learning.team_project <= 30 and course.learning_style.team_project <= 30:
        result.append("팀 프로젝트 비중이 낮은 수업 방식")
    if p.free_days:
        result.append(f"{'·'.join(p.free_days)}요일 공강 조건 충족")
    result.append("시간 충돌·학점 제한 검증 완료" if p.completed_ids is None else "선수과목·시간 충돌·학점 제한 검증 완료")
    return result


def recommend(request: RecommendRequest) -> dict:
    p = request.profile
    courses = load_courses()
    known_ids = {c.course_id for c in courses}
    imported_ids = [c.course_id for c in request.custom_courses]
    if len(set(imported_ids)) != len(imported_ids) or known_ids.intersection(imported_ids):
        raise ValueError("업로드 과목 ID가 중복되었습니다.")
    if any(not cid.startswith("upload-") for cid in imported_ids):
        raise ValueError("업로드 과목 ID가 올바르지 않습니다.")
    courses = (*courses, *request.custom_courses)
    by_id = {c.course_id: c for c in courses}
    all_ids = set((p.completed_ids or []) + p.required_ids + request.successful_ids + request.failed_ids + request.current_ids)
    unknown = all_ids - by_id.keys()
    if unknown:
        raise ValueError("존재하지 않는 과목: " + ", ".join(sorted(unknown)))
    successful, failed = set(request.successful_ids), set(request.failed_ids)
    if successful & failed:
        raise ValueError("수강 성공과 실패에 같은 과목이 있습니다.")
    selected: list[Course] = []
    for course_id in sorted(successful):
        c = by_id[course_id]
        reason = exclusion(c, p, failed)
        if reason or not compatible(c, selected, p.max_credits):
            raise ValueError(f"성공 과목을 유지할 수 없습니다: {c.name} ({reason or '시간 충돌 또는 학점 초과'})")
        selected.append(c)
    excluded, pool = [], []
    for c in courses:
        reason = exclusion(c, p, failed)
        if reason:
            excluded.append({"course_id": c.course_id, "name": c.name, "reason": reason})
        else:
            pool.append(c)
    scores = {c.course_id: score(c, p) for c in pool}
    required = set(p.required_ids) - set(p.completed_ids or [])

    # Registration recovery preserves other pending courses when feasible.
    def rank(c):
        return (
            c.course_id not in required,
            c.course_id not in request.current_ids,
            -scores[c.course_id]["total"],
            c.course_id,
        )

    pool.sort(key=rank)
    while True:
        candidates = [c for c in pool if compatible(c, selected, p.max_credits)]
        if not candidates:
            break
        # Compact days changes only feasible course selection; reported scores stay fixed.
        if p.compact_days:
            days = {m.day for c in selected for m in c.schedule}
            candidates.sort(
                key=lambda c: (
                    rank(c)[:2],
                    -(scores[c.course_id]["total"] - 5 * len({m.day for m in c.schedule} - days)),
                    c.course_id,
                )
            )
        selected.append(candidates[0])
    warnings = []
    if p.completed_ids is None:
        warnings.append("이수 내역을 입력받지 않아 선수과목 충족 여부와 재수강 여부는 확인하지 않았습니다. 학교 수강 요건을 확인하세요.")
    if request.custom_courses:
        warnings.append("업로드 과목의 시간과 학점은 확인한 입력으로 계산합니다. 성향·평가 비중은 중립값이며 실제 수강 요건은 학교에서 확인하세요.")
    missing_required = required - {c.course_id for c in selected}
    if missing_required:
        warnings.append(
            "필수과목을 모두 배치하지 못했습니다: "
            + ", ".join(by_id[i].name for i in sorted(missing_required))
            + ". 공강·선수과목·학점 조건을 확인하세요."
        )
    total = sum(c.credits for c in selected)
    if total < p.max_credits:
        warnings.append(
            f"조건을 지키며 {total}/{p.max_credits}학점을 배치했습니다. 남은 학점을 채울 유효한 조합은 현재 탐색에서 찾지 못했습니다."
        )
    rows = []
    for c in selected:
        rest = [x for x in selected if x.course_id != c.course_id]
        candidates = [x for x in pool if x.course_id != c.course_id and compatible(x, rest, p.max_credits)]
        # Keep a requested required course fixed. Other courses can only replace
        # it if it actually fails, with an explicit unsatisfied requirement warning.
        if c.course_id in required:
            candidates = []
        candidates.sort(
            key=lambda x: (
                -len(set(x.career_tags) & set(c.career_tags)),
                x.category != c.category,
                -scores[x.course_id]["total"],
                x.course_id,
            )
        )
        alternatives = [
            {
                "course": x.model_dump(),
                "score": scores[x.course_id],
                "reason": "진로 연관성·과목 구분을 우선하고 전체 시간표와 학점을 재검증한 후보입니다.",
            }
            for x in candidates[:3]
        ]
        evidence = facts(c, p, scores[c.course_id])
        rows.append(
            {
                "course": c.model_dump(),
                "score": scores[c.course_id],
                "evidence": evidence,
                "reason": ". ".join(evidence[:3]) + ".",
                "reason_source": "template",
                "alternatives": alternatives,
                "alternative_notice": ""
                if alternatives
                else "전체 시간표와 조건을 만족하는 대체 후보가 없습니다."
                if c.course_id not in required
                else "필수과목으로 지정되어 있습니다. 수강 실패 시 미충족 상태를 알려드립니다.",
                "status": "success" if c.course_id in successful else "pending",
            }
        )
    occupied = {m.day for c in selected for m in c.schedule}
    return {
        "recommendations": rows,
        "total_credits": total,
        "max_credits": p.max_credits,
        "free_days": [d for d in ["월", "화", "수", "목", "금", "토", "일"] if d not in occupied],
        "warnings": warnings,
        "excluded": excluded,
        "weights": WEIGHTS,
        "failed_ids": sorted(failed),
        "successful_ids": sorted(successful),
        "data_source": "fictional_sample",
        "explanation_mode": "template",
        "planner": "deterministic_greedy",
    }
