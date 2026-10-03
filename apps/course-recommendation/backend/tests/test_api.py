import json

import httpx
import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


@pytest.fixture(autouse=True)
def no_live_ai(monkeypatch):
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)


def test_courses_health_and_invalid_inputs():
    assert client.get("/health").json() == {"status": "ok", "courses": 25}
    assert len(client.get("/api/courses").json()["courses"]) == 25
    for profile in [{"max_credits": 100}, {"learning": {"exam": -1}}, {"completed_ids": ["no-such-course"]}]:
        assert client.post("/api/recommend", json={"profile": profile}).status_code == 422


def test_registration_success_then_failure_flow():
    profile = {"completed_ids": ["CS101", "CS102", "CS202"], "free_days": ["금"]}
    first = client.post("/api/recommend", json={"profile": profile}).json()
    current = [r["course"]["course_id"] for r in first["recommendations"]]
    body = {"profile": profile, "successful_ids": [current[0]], "current_ids": current, "failed_course_id": current[1]}
    response = client.post("/api/recommend/alternative", json=body)
    assert response.status_code == 200
    result = response.json()
    assert result["successful_ids"] == [current[0]]
    assert current[1] not in [r["course"]["course_id"] for r in result["recommendations"]]
    body["failed_course_id"] = current[0]
    assert client.post("/api/recommend/alternative", json=body).status_code == 422
    body["failed_course_id"] = "GE108"
    assert client.post("/api/recommend/alternative", json=body).status_code == 422


@pytest.mark.parametrize(
    "mode", ["valid", "timeout", "malformed", "wrong_id", "out_of_range", "duplicate", "incomplete"]
)
def test_ai_evidence_selection_and_fallback(monkeypatch, mode):
    base = client.post("/api/recommend", json={"profile": {"max_credits": 3}}).json()
    course_id = base["recommendations"][0]["course"]["course_id"]
    monkeypatch.setenv("OPENAI_API_KEY", "test-key-not-real")

    async def fake_post(self, url, **kwargs):
        assert kwargs["json"]["text"]["format"]["strict"] is True
        if mode == "timeout":
            raise httpx.ReadTimeout("test timeout")
        explanation = {
            "course_id": "fake" if mode == "wrong_id" else course_id,
            "evidence_indices": [999] if mode == "out_of_range" else [0, 0] if mode == "duplicate" else [0, 1],
            "tone": "fit",
        }
        output = "not json" if mode == "malformed" else json.dumps({"explanations": [explanation]})
        return httpx.Response(
            200,
            request=httpx.Request("POST", url),
            json={
                "status": "incomplete" if mode == "incomplete" else "completed",
                "output": [{"type": "message", "content": [{"type": "output_text", "text": output}]}],
            },
        )

    monkeypatch.setattr(httpx.AsyncClient, "post", fake_post)
    result = client.post("/api/recommend", json={"profile": {"max_credits": 3}}).json()
    assert result["explanation_mode"] == ("ai_evidence_selection" if mode == "valid" else "template")
    assert result["recommendations"][0]["score"] == base["recommendations"][0]["score"]
    if mode != "valid":
        assert result == base


def test_multi_career_and_uploaded_syllabus_api_contract():
    from app.engine import load_courses
    course = load_courses()[0].model_dump()
    course.update(course_id="upload-api-test", name="직접 올린 수업")
    body = {"profile": {"careers": ["Backend", "Embedded Software", "Data"], "completed_ids": None, "required_ids": [course["course_id"]]}, "custom_courses": [course]}
    response = client.post("/api/recommend", json=body)
    assert response.status_code == 200
    row = next(r for r in response.json()["recommendations"] if r["course"]["course_id"] == course["course_id"])
    assert all(value == 50 for part, value in row["score"]["parts"].items() if part != "schedule")
    body["profile"]["careers"].append("Frontend")
    assert client.post("/api/recommend", json=body).status_code == 422
    body["profile"]["careers"].pop()
    course["schedule"][0]["end"] = course["schedule"][0]["start"]
    assert client.post("/api/recommend", json=body).status_code == 422
