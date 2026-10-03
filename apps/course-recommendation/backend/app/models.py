from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator

Day = Literal["월", "화", "수", "목", "금"]
Style = Literal[
    "memorization", "problem_solving", "essay", "team_project", "presentation", "project", "exam", "practice"
]


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid")


class Preferences(StrictModel):
    memorization: int = Field(default=50, ge=0, le=100)
    problem_solving: int = Field(default=50, ge=0, le=100)
    essay: int = Field(default=50, ge=0, le=100)
    team_project: int = Field(default=50, ge=0, le=100)
    presentation: int = Field(default=50, ge=0, le=100)
    project: int = Field(default=50, ge=0, le=100)
    exam: int = Field(default=50, ge=0, le=100)
    practice: int = Field(default=50, ge=0, le=100)


class CampusLife(StrictModel):
    social: int = Field(default=50, ge=0, le=100)
    discussion: int = Field(default=50, ge=0, le=100)
    exploration: int = Field(default=50, ge=0, le=100)
    quiet: int = Field(default=50, ge=0, le=100)


class Profile(StrictModel):
    school: str = Field(default="국민대학교", max_length=100)
    major: str = Field(default="컴퓨터공학", max_length=100)
    year: int = Field(default=2, ge=1, le=6)
    semester: int = Field(default=1, ge=1, le=2)
    earned_credits: int = Field(default=30, ge=0, le=300)
    gpa: float = Field(default=3.5, ge=0, le=4.5)
    career: str = Field(default="Embedded Software", max_length=100)
    interests: str = Field(default="", max_length=300)
    career_confidence: int = Field(default=80, ge=0, le=100)
    learning: Preferences = Field(default_factory=Preferences)
    campus: CampusLife = Field(default_factory=CampusLife)
    completed_ids: list[str] = Field(default_factory=list, max_length=50)
    required_ids: list[str] = Field(default_factory=list, max_length=25)
    free_days: list[Day] = Field(default_factory=list, max_length=5)
    preferred_days: list[Day] = Field(default_factory=list, max_length=5)
    avoided_days: list[Day] = Field(default_factory=list, max_length=5)
    time_preference: Literal["any", "morning", "afternoon"] = "any"
    compact_days: bool = False
    max_credits: int = Field(default=18, ge=1, le=24)
    military_status: Literal["none", "completed", "planned", "undecided"] = "none"
    service_start: str = Field(default="", max_length=40)
    service_months: int = Field(default=18, ge=1, le=36)
    return_term: str = Field(default="", max_length=40)
    mbti: str = Field(default="", max_length=4)
    gender: str = Field(default="", max_length=30)


class Meeting(StrictModel):
    day: Day
    start: int = Field(ge=480, le=1200)
    end: int = Field(ge=480, le=1260)

    @model_validator(mode="after")
    def valid_range(self):
        if self.end <= self.start:
            raise ValueError("종료 시각은 시작 시각보다 늦어야 합니다.")
        return self


class Assessment(StrictModel):
    exam: int = Field(ge=0, le=100)
    assignment: int = Field(ge=0, le=100)
    project: int = Field(ge=0, le=100)
    participation: int = Field(ge=0, le=100)

    @model_validator(mode="after")
    def valid_total(self):
        if sum(self.model_dump().values()) != 100:
            raise ValueError("평가 비중의 합은 100이어야 합니다.")
        return self


class Course(StrictModel):
    course_id: str
    name: str
    credits: int = Field(ge=1, le=6)
    category: Literal["전공기초", "전공선택", "교양"]
    professor: str
    schedule: list[Meeting] = Field(min_length=1)
    assessment: Assessment
    learning_style: Preferences
    career_tags: list[str]
    prerequisites: list[str]
    campus_life: CampusLife
    recommended_year: int = Field(ge=1, le=6)
    syllabus: str


class RecommendRequest(StrictModel):
    profile: Profile
    successful_ids: list[str] = Field(default_factory=list, max_length=25)
    failed_ids: list[str] = Field(default_factory=list, max_length=25)
    current_ids: list[str] = Field(default_factory=list, max_length=25)


class AlternativeRequest(RecommendRequest):
    failed_course_id: str
