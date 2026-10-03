import type { Profile } from "./types";

export const baseProfile: Profile = {
  school: "국민대학교", major: "컴퓨터공학", year: 2, semester: 1, earned_credits: 30, gpa: 3.5,
  careers: ["Embedded Software"],
  learning: { memorization: 0, problem_solving: 100, essay: 0, team_project: 0, presentation: 0, project: 100, exam: 50, practice: 100 },
  campus: { social: 0, discussion: 0, exploration: 50, quiet: 100 },
  completed_ids: null, required_ids: [], free_days: ["금"], preferred_days: [],
  time_preference: "any", compact_days: false, max_credits: 18,
  military_status: "none", service_start: "", service_months: 18, return_term: "", mbti: "", gender: "",
};
export function persona(kind: "A" | "B"): Profile {
  const profile = structuredClone(baseProfile);
  if (kind === "B") Object.assign(profile, {
    year: 1, earned_credits: 0, careers: ["아직 모름"], completed_ids: null, free_days: [],
    learning: { memorization: 50, problem_solving: 50, essay: 50, team_project: 100, presentation: 100, project: 100, exam: 50, practice: 100 },
    campus: { social: 100, discussion: 100, exploration: 100, quiet: 0 },
    military_status: "planned", service_start: "다음 학년 1학기", return_term: "복무 후 2학기",
  });
  return profile;
}
