from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException

from .engine import load_courses, recommend
from .models import AlternativeRequest, RecommendRequest

load_dotenv()
app = FastAPI(title="딸깍 수강전략 API", version="0.1.0")


@app.get("/health")
def health():
    return {"status": "ok", "courses": len(load_courses())}


@app.get("/api/courses")
def courses():
    return {"courses": [c.model_dump() for c in load_courses()], "data_source": "fictional_sample"}


async def build_result(body: RecommendRequest):
    try:
        result = recommend(body)
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error
    from .explanations import explain

    return await explain(result)


@app.post("/api/recommend")
async def recommendations(body: RecommendRequest):
    return await build_result(body)


@app.post("/api/recommend/alternative")
async def alternative(body: AlternativeRequest):
    if body.failed_course_id not in body.current_ids:
        raise HTTPException(status_code=422, detail="현재 추천 목록의 과목만 수강 실패로 선택할 수 있습니다.")
    if body.failed_course_id in body.successful_ids:
        raise HTTPException(status_code=422, detail="수강 성공을 해제한 뒤 실패로 선택하세요.")
    updated = RecommendRequest(**body.model_dump(exclude={"failed_course_id"}))
    updated.failed_ids = sorted(set(body.failed_ids + [body.failed_course_id]))
    return await build_result(updated)
