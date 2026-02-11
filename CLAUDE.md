# amelia.food — Project Context

## What This Is
A personal website at `amelia.food` — a Valentine's Day gift for Amelia (Amy). A place she discovers things over time. The homepage is a top-down view of a table surface with objects placed on it. No nav, no header, no app-shell UI. Just the table.

## Tech Stack
- **Framework**: Next.js 16 (App Router) with React 19
- **AI**: Vercel AI SDK v6 (`ai`, `@ai-sdk/anthropic`, `@ai-sdk/react`) — use for ALL AI interactions
- **Anthropic model**: `claude-haiku-4-5-20251001` for the emoji game (fast, cheap, playful)
- **Styling**: CSS modules + CSS variables in globals.css — **NO TAILWIND** (remove it)
- **Fonts**: `next/font/google` — Lora (display serif), Caveat (handwritten), system sans-serif fallback
- **Emoji data**: `emojibase` v17 for comprehensive searchable emoji dataset
- **API key**: `ANTHROPIC_API_KEY` already in `.env`

## Design Language — "Warm Tactile Whimsy"
- Warm, tactile, considered, quietly playful, intimate
- NOT a SaaS product, NOT minimalist-startup-clean, NOT loud
- Should feel like opening a handmade gift, a quiet room with good light

## Color Palette (CSS variables)
- Background/surface: `#F5F0E8`, `#EDE8DF`, `#FAF7F2` (warm cream/parchment)
- Primary accent: `#6B2D5B`, `#8B3A62` (deep plum/burgundy)
- Secondary accent: `#2D5B4B`, `#3A6B5B` (forest green/deep teal)
- Warm highlight: `#C4723A`, `#B85C38` (burnt orange/terracotta)
- Text: `#3A3230`, `#2C2825` (deep warm brown, NOT pure black)
- Subtle gold: `#C4A265`, `#B8956A`

## File Structure
```
app/
  layout.tsx              — Root layout, fonts, global styles
  page.tsx                — The Table homepage
  globals.css             — CSS variables, textures, base styles
  api/chat/route.ts       — Vercel AI SDK streaming endpoint
components/
  Table.tsx + Table.module.css
  TableObject.tsx + TableObject.module.css
  EmojiGame.tsx + EmojiGame.module.css
  EmojiPicker.tsx + EmojiPicker.module.css
  EmojiComposer.tsx + EmojiComposer.module.css
  Conversation.tsx + Conversation.module.css
  Valentine.tsx + Valentine.module.css
  Modal.tsx + Modal.module.css
data/
  emoji.ts                — Processed emoji dataset with search metadata
lib/
  anthropic.ts            — Server-side AI helper (Vercel AI SDK)
public/
  assets/textures/        — Generated SVG/CSS textures
```

## Key Design Rules
- Objects on table: subtle shadows, gentle lift on hover, 1-2 degree rotation
- All motion is gentle — no bouncing, no snapping, no aggressive transitions
- Mobile-first responsive; touch interactions on mobile, hover on desktop
- No analytics, no tracking, no cookies
- "Amelia" appears subtly handwritten somewhere on the table surface
- Her name on table, valentine text = Caveat (handwritten font)

## Vercel AI SDK v6 Patterns
```typescript
// API route (app/api/chat/route.ts)
import { anthropic } from '@ai-sdk/anthropic';
import { streamText, convertToModelMessages, UIMessage } from 'ai';

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();
  const result = streamText({
    model: anthropic('claude-haiku-4-5-20251001'),
    system: '...emoji system prompt...',
    messages: await convertToModelMessages(messages),
  });
  return result.toUIMessageStreamResponse();
}

// Client component
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
const { messages, sendMessage } = useChat({
  transport: new DefaultChatTransport({ api: '/api/chat' }),
});
```

## Testing
- Run `npm run dev` and verify at http://localhost:3000
- Use Chrome MCP tools to take snapshots and screenshots for visual verification
- Test both desktop viewport and mobile (390x844) viewport
