import { anthropic } from '@ai-sdk/anthropic';
import { streamText, convertToCoreMessages, type Message } from 'ai';
import { EMOJI_SYSTEM_PROMPT } from '@/lib/prompts';

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages }: { messages: Message[] } = await req.json();

  const result = streamText({
    model: anthropic('claude-haiku-4-5-20251001'),
    system: EMOJI_SYSTEM_PROMPT,
    messages: convertToCoreMessages(messages),
  });

  return result.toDataStreamResponse();
}
