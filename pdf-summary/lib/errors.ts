import Anthropic from "@anthropic-ai/sdk";
import { ApiError } from "@google/genai";

// 모델이 답을 거부했거나 중간에 잘려서 쓸 수 없는 경우
export class UnusableOutputError extends Error {}

export class MissingKeyError extends Error {}

export function errorResponse(e: unknown) {
  if (e instanceof MissingKeyError) {
    return Response.json({ error: e.message }, { status: 500 });
  }
  if (e instanceof UnusableOutputError) {
    return Response.json(
      { error: "이 자료는 정리하지 못했어요. 다른 파일로 시도해 주세요." },
      { status: 422 },
    );
  }

  const status =
    e instanceof Anthropic.APIError ? e.status : e instanceof ApiError ? e.status : undefined;

  if (status === 429) {
    return Response.json(
      { error: "요청이 몰리고 있어요. 잠시 후 다시 시도해 주세요." },
      { status: 429 },
    );
  }
  if (status !== undefined) {
    console.error("[ai]", status, e instanceof Error ? e.message : e);
    return Response.json(
      { error: "AI 서버 오류가 발생했어요. 다시 시도해 주세요." },
      { status: 502 },
    );
  }

  console.error("[server]", e);
  return Response.json({ error: "알 수 없는 오류가 발생했어요." }, { status: 500 });
}
