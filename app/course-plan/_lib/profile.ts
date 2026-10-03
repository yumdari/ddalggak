import type { Profile } from "./types";

export const baseProfile: Profile = {
  school: "국민대학교", major: "컴퓨터공학", year: 2, semester: 1, earned_credits: 30, gpa: 3.5,
  career: "Embedded Software", interests: "", career_confidence: 80,
  learning: { memorization: 20, problem_solving: 90, essay: 30, team_project: 10, presentation: 10, project: 70, exam: 60, practice: 80 },
  campus: { social: 20, discussion: 20, exploration: 50, quiet: 80 },
  completed_ids: ["CS101", "CS102", "CS202"], required_ids: [], free_days: ["금"], preferred_days: [], avoided_days: [],
  time_preference: "any", compact_days: false, max_credits: 18,
  military_status: "none", service_start: "", service_months: 18, return_term: "", mbti: "", gender: "",
};
export function persona(kind: "A" | "B"): Profile {
  const profile = structuredClone(baseProfile);
  if (kind === "B") Object.assign(profile, {
    year: 1, earned_credits: 0, career: "아직 모름", career_confidence: 20, completed_ids: [], free_days: [],
    learning: { memorization: 50, problem_solving: 65, essay: 65, team_project: 80, presentation: 70, project: 70, exam: 40, practice: 70 },
    campus: { social: 90, discussion: 85, exploration: 100, quiet: 20 },
    military_status: "planned", service_start: "다음 학년 1학기", return_term: "복무 후 2학기",
  });
  return profile;
}
