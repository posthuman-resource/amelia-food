# Upgrade Vercel AI SDK to v6

## Objective

The project is stuck on AI SDK v4 (`ai@4.3.19`) when v6 (`ai@6.0.82`) has been out since late 2025. This blocks access to `experimental_generateSpeech`, the unified speech API, async `convertToModelMessages`, and other improvements. The CLAUDE.md already documents v6 patterns, so the code and docs are currently out of sync.

## Current State

| Package | Installed | Target |
|---------|-----------|--------|
| `ai` | 4.3.19 | 6.x |
| `@ai-sdk/react` | 1.0.23 | 3.x |
| `@ai-sdk/openai` | 1.3.24 | 3.x |
| `@ai-sdk/anthropic` | 1.0.8 | 3.x |

## Requirements

- [x] Upgrade all four AI SDK packages to latest
- [x] Migrate `app/api/chat/route.ts` — `convertToCoreMessages` → async `convertToModelMessages`, `Message` → `UIMessage`, `toDataStreamResponse` → `toUIMessageStreamResponse`
- [x] Migrate `app/api/explain/route.ts` — `CoreMessage` → `ModelMessage`, `toDataStreamResponse` → `toTextStreamResponse` (plain text, simpler client parsing)
- [x] Migrate `app/api/emoji-search/route.ts` — `openai.embedding()` no longer takes options; moved `dimensions` to `providerOptions`
- [x] Migrate `components/EmojiGame.tsx` — `useChat` with `DefaultChatTransport`, `append` → `sendMessage`, `Message` → `UIMessage`, `isLoading` → derived from `status`, parts-based message access, simplified explain stream parsing
- [x] Migrate `components/Conversation.tsx` — `Message` → `UIMessage`, `message.content` → parts-based `getText()` helper
- [x] Migrate `scripts/generate-emoji-embeddings.ts` — moved `dimensions` to `providerOptions`
- [x] Update CLAUDE.md if any documented patterns are stale
- [x] Verify the app builds (`npm run build`)
- [x] Verify emoji game works end-to-end (conversation, explain modal, emoji search)

## Technical Approach

### Key Breaking Changes (v4 → v5 → v6)

**Renames:**
- `convertToCoreMessages()` → `convertToModelMessages()` (now **async** in v6)
- `type Message` → `type UIMessage`
- `type CoreMessage` → `type ModelMessage`
- `toDataStreamResponse()` → `toUIMessageStreamResponse()`
- `useChat().append()` → `useChat().sendMessage()`

**Behavioral changes:**
- `convertToModelMessages` is now async — must be `await`ed
- `sendMessage` takes structured input: `sendMessage({ text: '...' })` instead of `append({ role: 'user', content: '...' })`
- UIMessage in v6 uses a parts-based structure — `message.parts` instead of `message.content` for rich content, though `message.content` may still work for simple text
- Stream format may differ — the manual `0:"text"` parsing in the explain handler needs verification

### Migration Order

1. Upgrade packages
2. Run codemod if available: `npx @ai-sdk/codemod v6`
3. Fix any remaining issues manually
4. Test each feature

### Key Files

- `app/api/chat/route.ts` — emoji game streaming endpoint
- `app/api/explain/route.ts` — conversation explanation endpoint
- `app/api/emoji-search/route.ts` — semantic emoji search
- `components/EmojiGame.tsx` — main client using useChat + manual explain stream
- `components/Conversation.tsx` — message display component
- `scripts/generate-emoji-embeddings.ts` — offline embedding script
- `CLAUDE.md` — documented SDK patterns

## Acceptance Criteria

- [x] All four packages on latest major version
- [x] `npm run build` succeeds with no errors
- [x] Emoji game: can send emoji, receive responses, see streaming
- [x] Explain modal: streams explanation text correctly
- [x] Emoji search: semantic search returns results
- [x] No TypeScript errors related to AI SDK types
