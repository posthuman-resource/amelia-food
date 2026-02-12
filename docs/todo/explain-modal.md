# Explain Mode → Modal with Streaming Markdown

## Objective

Move the "what just happened?" explain response out of the inline chat and into a modal overlay. Currently, clicking the explain button appends a user message to the conversation, and the prose response clutters the emoji chat history. Instead, the explain action should trigger a separate API call (not pollute the chat messages), stream the response into a modal with proper markdown rendering, and let the user dismiss it to return cleanly to the game.

## Requirements

- [x] Install `streamdown` (Vercel's streaming markdown component)
- [x] Change "what just happened?" from appending a chat message to making a separate streaming API call
- [x] Display the streamed explain response in the existing Modal component using `<Streamdown>`
- [x] Style the modal content for readable prose (serif font, warm colors, proper spacing)
- [x] Ensure the explain response doesn't appear in the emoji chat history at all
- [x] On modal close, user returns to game with clean chat — no explain text in messages

## Technical Approach

### 1. Streamdown — Vercel's Streaming Markdown Component

Use Vercel's `streamdown` package — a drop-in streaming markdown renderer designed for AI responses. Handles incomplete/unterminated markdown blocks that arise mid-stream.

```tsx
import { Streamdown } from 'streamdown';
import 'streamdown/styles.css';

<Streamdown isAnimating={isStreaming}>
  {markdownText}
</Streamdown>
```

No Tailwind required — import the bundled `streamdown/styles.css` and override styles as needed with our own CSS to match the warm tactile aesthetic.

### 2. Separate Explain API Call

Instead of using `append()` from `useChat` (which adds to the conversation), make a direct streaming fetch to a new `/api/explain` endpoint. The explain call should:
- Send the current emoji messages as context
- NOT add any messages to the `useChat` state
- Stream the response into local component state

The cleanest approach: use the AI SDK's `streamText` on the server and consume it client-side with a simple fetch + ReadableStream, storing the accumulating text in local state.

### 3. Modal Display

Use the existing `Modal` component to show the explain response:
- Open modal immediately when "what just happened?" is clicked
- Show a gentle loading state while waiting for first token
- Stream markdown content via `<Streamdown>` inside the modal
- Close button dismisses and clears the explain state

### Key Files

- `components/EmojiGame.tsx` — change `handleExplain` to use separate API call + modal
- `components/EmojiGame.module.css` — modal content styling
- `app/api/explain/route.ts` — new endpoint for explain-only requests
- `app/globals.css` — import `streamdown/styles.css`, override styles to match design language
- `components/Conversation.tsx` — remove explain-specific rendering (`.explain` class)

### Design Notes

Modal content should feel like a warm letter explaining the conversation:
- Serif font (Lora) for body text
- Warm cream background (matches modal existing style)
- Gentle padding, comfortable line-height (1.6+)
- Markdown elements styled to match the design language:
  - Headings in plum/burgundy
  - Emphasis in warm brown
  - Lists with custom bullet styling
  - No code blocks expected, but handle gracefully

## Acceptance Criteria

- [x] Clicking "what just happened?" opens a modal (not inline chat message)
- [x] The explain response streams into the modal with proper markdown rendering
- [x] No explain-related messages appear in the emoji chat history
- [x] Modal can be dismissed with close button or Escape key
- [x] After dismissing, the emoji game chat is exactly as it was before clicking explain
- [x] Markdown formatting (bold, italic, lists, paragraphs) renders correctly
- [x] Loading state shows while waiting for first token
- [x] Works on both desktop and mobile viewports
- [x] Build passes (`npm run build`)
