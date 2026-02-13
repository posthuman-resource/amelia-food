import { anthropic } from "@ai-sdk/anthropic";
import { streamText, type ModelMessage } from "ai";
import { EXPLAIN_SYSTEM_PROMPT } from "@/lib/prompts";

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages }: { messages: ModelMessage[] } = await req.json();

  const result = streamText({
    model: anthropic("claude-haiku-4-5-20251001"),
    system: EXPLAIN_SYSTEM_PROMPT,
    messages,
  });

  return result.toTextStreamResponse();
}
