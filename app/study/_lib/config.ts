export const MAX_PDF_BYTES = 4 * 1024 * 1024; // Vercel 요청 본문 한도(4.5MB) 안쪽

export type Provider = "gemini" | "claude";

// AI_PROVIDER 가 없으면 gemini
export function provider(): Provider {
  return process.env.AI_PROVIDER === "claude" ? "claude" : "gemini";
}
