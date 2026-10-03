export type Day = "월" | "화" | "수" | "목" | "금";
export type LearningKey = "memorization" | "problem_solving" | "essay" | "team_project" | "presentation" | "project" | "exam" | "practice";
export type CampusKey = "social" | "discussion" | "exploration" | "quiet";
export type Profile = {
  school: string; major: string; year: number; semester: number; earned_credits: number; gpa: number;
  careers: string[]; learning: Record<LearningKey, number>;
  campus: Record<CampusKey, number>; completed_ids: null; required_ids: string[];
  free_days: Day[]; preferred_days: Day[]; time_preference: "any" | "morning" | "afternoon";
  compact_days: boolean; max_credits: number; military_status: "none" | "completed" | "planned" | "undecided";
  service_start: string; service_months: number; return_term: string; mbti: string; gender: string;
};
export type Course = {
  course_id: string; name: string; credits: number; category: string; professor: string;
  schedule: { day: Day; start: number; end: number }[]; prerequisites: string[]; syllabus: string;
  learning_style?: Record<LearningKey, number>; campus_life?: Record<CampusKey, number>; career_tags?: string[]; recommended_year?: number;
  assessment: { exam: number; assignment: number; project: number; participation: number };
};
export type Score = { total: number; parts: Record<"career" | "learning" | "assessment" | "schedule" | "campus" | "academic", number> };
export type Recommendation = {
  course: Course; score: Score; evidence: string[]; reason: string; reason_source: string; status: "pending" | "success";
  alternatives: { course: Course; score: Score; reason: string }[]; alternative_notice: string;
};
export type Result = {
  recommendations: Recommendation[]; total_credits: number; max_credits: number; free_days: Day[];
  warnings: string[]; failed_ids: string[]; successful_ids: string[]; explanation_mode: string;
  excluded: { course_id: string; name: string; reason: string }[];
};
