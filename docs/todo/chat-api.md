# Set Up the Chat API Route with Vercel AI SDK

## Objective

Create the server-side API route that powers the emoji game. Uses Vercel AI SDK v6 with the Anthropic provider to stream responses from Claude Haiku. The system prompt instructs Claude to communicate exclusively in emoji.

## Requirements

- [ ] API route at `app/api/chat/route.ts`
- [ ] Uses Vercel AI SDK v6: `streamText`, `convertToModelMessages`, `UIMessage`
- [ ] Uses `@ai-sdk/anthropic` provider with `claude-haiku-4-5-20251001`
- [ ] System prompt for emoji-only communication (from primer)
- [ ] Streams responses back to client via `toUIMessageStreamResponse()`
- [ ] `maxDuration` set appropriately for streaming
- [ ] API key read from `ANTHROPIC_API_KEY` env var (handled automatically by @ai-sdk/anthropic)

## Technical Approach

### Key Files
- `app/api/chat/route.ts` — The API route handler

### System Prompt
```
You are playing an emoji conversation game. Rules:
- Communicate ONLY in emoji. Never use words, letters, or numbers.
- Start simple (1-3 emoji) and gradually increase complexity as the conversation progresses.
- Be warm, playful, a little funny, occasionally surprising.
- Use emoji poetically, not just literally (e.g., 🌊🪞 for "reflection" or "deep thoughts").
- Respond thoughtfully to the user's emoji, building on what they send.
- Occasionally reference: cats 🐱, yarn 🧶, ballet 🩰, books 📚, the moon 🌙, chocolate 🍫, coffee ☕
- If the user sends a message containing the word "explain" or "what happened" or "translate", break character and explain the conversation so far in warm, friendly words. Describe what you were trying to communicate, what you interpreted from their responses, and how the emoji carried meaning. Then ask if they want to continue.
- The tone should feel like a patient, witty friend teaching a new language through immersion.
```

### Route Implementation
```typescript
import { anthropic } from '@ai-sdk/anthropic';
import { streamText, convertToModelMessages, type UIMessage } from 'ai';

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: anthropic('claude-haiku-4-5-20251001'),
    system: EMOJI_SYSTEM_PROMPT,
    messages: await convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}
```

## Acceptance Criteria

- [ ] POST to `/api/chat` with messages returns a streaming response
- [ ] Claude responds with emoji only (no words) for emoji-only input
- [ ] Claude explains in words when asked "what happened?"
- [ ] Streaming works correctly (progressive token delivery)
- [ ] No API key exposure on client side
