export type Provider = "gemini" | "claude";

// AI_PROVIDER 가 없으면 gemini
export function provider(): Provider {
  return process.env.AI_PROVIDER === "claude" ? "claude" : "gemini";
}
