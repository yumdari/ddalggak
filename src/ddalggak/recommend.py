"""Transparent first-pass matching for a student's feed."""

import json

from .domain import deadline_status


def match(opportunity, user):
    """Return score and reasons, or None for a known mismatch or expired item."""
    if deadline_status(opportunity) == "마감":
        return None
    grade = user["grade"] if user else None
    region = user["region"] if user else None
    if grade is not None:
        if opportunity["grade_min"] is not None and grade < opportunity["grade_min"]:
            return None
        if opportunity["grade_max"] is not None and grade > opportunity["grade_max"]:
            return None
    if region and opportunity["region"] and opportunity["region"] not in (region, "전국"):
        return None

    tags = set(opportunity["tags"])
    interests = set(json.loads(user["interests"])) if user else set()
    matched_tags = sorted(tags & interests)
    reasons = [f"관심 분야: {', '.join(matched_tags)}"] if matched_tags else []
    score = len(matched_tags) * 10
    if grade is not None and (
        opportunity["grade_min"] is not None or opportunity["grade_max"] is not None
    ):
        score += 3
        reasons.append("학년 조건 일치")
    if region and opportunity["region"] in (region, "전국"):
        score += 2
        reasons.append("지역 조건 일치")
    if opportunity["deadline_kind"] in ("date_only", "datetime"):
        score += 1
    if not reasons:
        reasons.append("새로운 공고")
    return {"score": score, "reasons": reasons}


def rank(opportunities, user):
    results = []
    for opportunity in opportunities:
        matched = match(opportunity, user)
        if matched is not None:
            results.append({**opportunity, **matched})
    results.sort(key=lambda item: (item["score"], item["created_at"]), reverse=True)
    return results
