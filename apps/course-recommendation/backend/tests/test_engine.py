import random

import pytest

from app.engine import WEIGHTS, conflicts, exclusion, load_courses, recommend
from app.models import Profile, RecommendRequest


def profile_a():
    return Profile(
        completed_ids=["CS101", "CS102", "CS202"],
        free_days=["금"],
        learning={
            "memorization": 20,
            "problem_solving": 90,
            "essay": 30,
            "team_project": 10,
            "presentation": 10,
            "project": 70,
            "exam": 60,
            "practice": 80,
        },
        campus={"social": 20, "discussion": 20, "exploration": 50, "quiet": 80},
    )


def assert_feasible(result, profile):
    by_id = {c.course_id: c for c in load_courses()}
    selected = [by_id[r["course"]["course_id"]] for r in result["recommendations"]]
    assert len(selected) == len({c.course_id for c in selected})
    assert sum(c.credits for c in selected) == result["total_credits"] <= profile.max_credits
    for i, c in enumerate(selected):
        assert not exclusion(c, profile, set(result["failed_ids"]))
        assert all(not conflicts(c, x) for x in selected[i + 1 :])
        assert 0 <= result["recommendations"][i]["score"]["total"] <= 100
        assert result["recommendations"][i]["reason"]
        for alt in result["recommendations"][i]["alternatives"]:
            candidate = by_id[alt["course"]["course_id"]]
            rest = selected[:i] + selected[i + 1 :]
            assert not exclusion(candidate, profile, set(result["failed_ids"]))
            assert candidate.course_id not in {x.course_id for x in selected}
            assert all(not conflicts(candidate, x) for x in rest)
            assert sum(x.credits for x in rest) + candidate.credits <= profile.max_credits


def test_persona_a_is_reproducible_and_embedded_focused():
    p = profile_a()
    result = recommend(RecommendRequest(profile=p))
    assert result == recommend(RecommendRequest(profile=p))
    ids = {r["course"]["course_id"] for r in result["recommendations"]}
    assert {"CS201", "CS205", "CS206", "CS207"} <= ids
    assert "금" in result["free_days"]
    assert_feasible(result, p)


def test_persona_b_explores_foundations_and_general_courses():
    p = Profile(
        year=1,
        earned_credits=0,
        career="아직 모름",
        career_confidence=20,
        military_status="planned",
        learning={"team_project": 80, "presentation": 70, "practice": 70, "exam": 40},
        campus={"social": 90, "discussion": 85, "exploration": 100, "quiet": 20},
    )
    result = recommend(RecommendRequest(profile=p))
    assert {"전공기초", "교양"} <= {r["course"]["category"] for r in result["recommendations"]}
    assert_feasible(result, p)


def test_repeated_failure_keeps_success_and_excludes_failures():
    p = profile_a()
    result = recommend(RecommendRequest(profile=p))
    successful = result["recommendations"][0]["course"]["course_id"]
    failed = []
    for _ in range(6):
        current = [r["course"]["course_id"] for r in result["recommendations"]]
        pending = [cid for cid in current if cid != successful]
        if not pending:
            break
        failed.append(pending[0])
        result = recommend(
            RecommendRequest(profile=p, successful_ids=[successful], failed_ids=failed, current_ids=current)
        )
        ids = {r["course"]["course_id"] for r in result["recommendations"]}
        assert successful in ids
        assert not ids.intersection(failed)
        assert_feasible(result, p)


def test_no_available_courses_is_honest():
    p = Profile(free_days=["월", "화", "수", "목", "금"])
    result = recommend(RecommendRequest(profile=p))
    assert result["recommendations"] == [] and result["total_credits"] == 0
    assert result["warnings"]


def test_required_course_prioritized_and_impossible_requirement_reported():
    result = recommend(RecommendRequest(profile=Profile(max_credits=3, required_ids=["CS101"])))
    assert result["recommendations"][0]["course"]["course_id"] == "CS101"
    impossible = recommend(RecommendRequest(profile=Profile(required_ids=["CS301"])))
    assert any("필수과목" in w and "임베디드SW" in w for w in impossible["warnings"])


@pytest.mark.parametrize(
    "changes",
    [
        {"successful_ids": ["CS101"], "failed_ids": ["CS101"]},
        {"successful_ids": ["UNKNOWN"]},
        {"successful_ids": ["CS301"]},
    ],
)
def test_invalid_success_state_rejected(changes):
    with pytest.raises(ValueError):
        recommend(RecommendRequest(profile=Profile(), **changes))


def test_completed_and_forbidden_success_rejected():
    with pytest.raises(ValueError):
        recommend(RecommendRequest(profile=profile_a(), successful_ids=["CS101"]))
    with pytest.raises(ValueError):
        recommend(RecommendRequest(profile=Profile(free_days=["월"]), successful_ids=["CS101"]))


def test_adjacent_meetings_do_not_conflict():
    c = load_courses()[0]
    adjacent = c.model_copy(
        update={
            "schedule": [c.schedule[0].model_copy(update={"start": c.schedule[0].end, "end": c.schedule[0].end + 60})]
        }
    )
    assert not conflicts(c, adjacent)
    assert conflicts(c, c)


def test_gender_and_mbti_do_not_affect_recommendation():
    p = profile_a()
    assert recommend(RecommendRequest(profile=p)) == recommend(
        RecommendRequest(profile=p.model_copy(update={"gender": "여성", "mbti": "INTP"}))
    )


def test_score_weight_is_consistent():
    assert sum(WEIGHTS.values()) == pytest.approx(1)
    for row in recommend(RecommendRequest(profile=profile_a()))["recommendations"]:
        assert row["score"]["total"] == round(sum(row["score"]["parts"][k] * w for k, w in WEIGHTS.items()), 1)


@pytest.mark.parametrize("seed", range(25))
def test_randomized_profiles_and_alternatives_obey_constraints(seed):
    rng = random.Random(seed)
    p = profile_a()
    p.max_credits = rng.randint(1, 24)
    p.free_days = rng.sample(["월", "화", "수", "목", "금"], rng.randint(0, 5))
    p.compact_days = bool(seed % 2)
    p.completed_ids = rng.sample([c.course_id for c in load_courses()], rng.randint(0, 10))
    assert_feasible(recommend(RecommendRequest(profile=p)), p)


def test_multiple_careers_match_any_selection_and_order_does_not_matter():
    from app.engine import score
    course = next(c for c in load_courses() if "Embedded Software" in c.career_tags)
    p = Profile(careers=["Frontend", "Embedded Software", "Data"])
    assert score(course, p)["parts"]["career"] == 100
    assert score(course, p) == score(course, Profile(careers=list(reversed(p.careers))))


@pytest.mark.parametrize("careers", [["A", "B", "C", "D"], ["A", "A"], [""], ["아직 모름", "Data"]])
def test_invalid_careers_rejected(careers):
    with pytest.raises(ValueError):
        Profile(careers=careers)


def test_missing_history_does_not_invent_completed_courses():
    p = Profile(completed_ids=None, required_ids=["CS301"])
    result = recommend(RecommendRequest(profile=p))
    assert any(r["course"]["course_id"] == "CS301" for r in result["recommendations"])
    assert any("선수과목 충족 여부" in w for w in result["warnings"])
    assert all("선수과목·시간" not in r["reason"] for r in result["recommendations"])


def test_uploaded_course_is_required_and_survives_recovery():
    course = load_courses()[0].model_copy(update={"course_id": "upload-test", "name": "업로드 수업"})
    p = Profile(completed_ids=None, required_ids=[course.course_id])
    req = RecommendRequest(profile=p, custom_courses=[course])
    result = recommend(req)
    assert any(r["course"]["course_id"] == course.course_id for r in result["recommendations"])
    current = [r["course"]["course_id"] for r in result["recommendations"]]
    failed = next(cid for cid in current if cid != course.course_id)
    result = recommend(RecommendRequest(profile=p, custom_courses=[course], successful_ids=[course.course_id], failed_ids=[failed], current_ids=current))
    assert course.course_id in result["successful_ids"]
    assert failed not in [r["course"]["course_id"] for r in result["recommendations"]]
    blocked = recommend(RecommendRequest(profile=Profile(required_ids=[course.course_id], free_days=[course.schedule[0].day]), custom_courses=[course]))
    assert any("업로드 수업" in w for w in blocked["warnings"])
    with pytest.raises(ValueError):
        recommend(RecommendRequest(profile=p, custom_courses=[course, course]))


def test_weekend_upload_obeys_conflicts_and_free_days():
    from app.models import Course

    data = load_courses()[0].model_dump()
    data.update(course_id="upload-weekend", schedule=[{"day": "토", "start": 660, "end": 780}])
    course = Course.model_validate(data)
    p = Profile(required_ids=[course.course_id], completed_ids=None)
    result = recommend(RecommendRequest(profile=p, custom_courses=[course]))
    assert any(r["course"]["course_id"] == course.course_id for r in result["recommendations"])
    assert "토" not in result["free_days"]
    assert conflicts(course, course)
    p.free_days = ["토"]
    blocked = recommend(RecommendRequest(profile=p, custom_courses=[course]))
    assert all(r["course"]["course_id"] != course.course_id for r in blocked["recommendations"])
