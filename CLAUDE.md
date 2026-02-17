# amelia.food — Project Context

## What This Is

A personal website at `amelia.food` — a Valentine's Day gift for Amelia (Amy). A place she discovers things over time. The homepage is a top-down view of a table surface with objects placed on it. No nav, no header, no app-shell UI. Just the table.

## Tech Stack

- **Framework**: Next.js 16 (App Router) with React 19
- **AI**: Vercel AI SDK v6 (`ai`, `@ai-sdk/anthropic`, `@ai-sdk/react`) — use for ALL AI interactions
- **Anthropic model**: `claude-sonnet-4-5-20250929` for the emoji game (better instruction-following)
- **OpenAI**: `openai` + `@ai-sdk/openai` — embeddings (`text-embedding-3-small`) and TTS (`gpt-audio`)
- **Markdown rendering**: `streamdown` — streaming AI explanation text
- **Styling**: CSS modules + CSS variables in globals.css — **NO TAILWIND** (remove it)
- **Fonts**: `next/font/google` — Lora (display serif), Caveat (handwritten), Courier Prime (monospace), system sans-serif fallback
- **Emoji data**: `emojibase` v17 for comprehensive searchable emoji dataset

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
  layout.tsx, page.tsx, globals.css
  api/
    auth/route.ts             — Password auth (HMAC tokens)
    chat/route.ts             — Emoji game streaming (Anthropic)
    emoji-search/route.ts     — Semantic emoji search (OpenAI embeddings)
    explain/route.ts          — Explain emoji conversation (Anthropic)
    words/route.ts            — Save generated word to DB
    words/generate/route.ts   — Generate German compound words (Anthropic)
    word-audio/route.ts       — TTS pronunciation (OpenAI)
    venn/route.ts             — Create Venn entry
    venn/[id]/route.ts        — Delete Venn entry
components/                   — Each with .tsx + .module.css
  Table, TableObject          — Main layout + draggable objects
  Modal                       — Reusable dialog overlay
  CardStack                   — Stacked cards on table + fanned overlay
  EmojiGame, EmojiPicker,
    EmojiComposer, Conversation — Emoji chat feature
  WordCard, WordCreator       — German compound word feature
  Poem, Page                  — Content display (markdown)
  VennDiagram                 — Interactive Venn diagram
  Valentine, Welcome          — Gift card + welcome letter
  AuthLock                    — Password lock overlay
  Neko                        — Pixel cat animation
hooks/
  useMediaQuery.ts            — SSR-safe media query
  useMounted.ts               — SSR-safe mounted flag
  useScrollLock.ts            — Prevent body scroll (overlays)
  useEscapeKey.ts             — Escape key listener
  useCloseAnimation.ts        — Animated close with delay
  useTabTitle.ts              — Animated emoji title bar (Web Worker)
data/
  types.ts                    — Shared types (TablePosition)
  emoji.ts                    — Processed emoji dataset
  emoji-embeddings.json       — Vector embeddings for semantic search
  words.ts                    — Seeded word definitions
  pages.ts + pages/*.md       — Page metadata + markdown content
  poems.ts + poems/*.md       — Poem metadata + markdown content
lib/
  auth.ts                     — HMAC token auth + password verification
  messages.ts                 — AI message text extraction
  prompts.ts                  — All LLM system prompts (single source of truth)
  pages.ts                    — Load pages from filesystem
  poems.ts                    — Load poems from filesystem
  words.ts                    — Load words from database
  venn.ts                     — Venn diagram DB queries
  vennLayout.ts               — Word-packing layout algorithm (SAT collision)
db/
  schema.ts                   — Drizzle schema (words, vennEntries tables)
  client.ts                   — SQLite connection (singleton)
  seed.ts                     — Idempotent data seeding
  migrations/                 — Generated SQL migrations
scripts/
  generate-emoji-embeddings.ts — Batch emoji vector generation (OpenAI)
```

## LLM Personality (all contexts)

Minimalist, a little eccentric, quirky, fun. Dry humor. Not overly helpful or cheerful — never gushing, never a pep talk. But genuinely good and kind, in the way that shows up in what you notice and how you pay attention, not in how many nice words you use. Think: a friend who gives oddly perfect gifts and says very little about them.

The only user is Amelia. She already knows what this site is. Never explain the site's concept, metaphors, or premise back to her — no "on amelia.food, nourishment represents..." preamble. Just talk to her.

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
import { anthropic } from "@ai-sdk/anthropic";
import { streamText, convertToModelMessages, type UIMessage } from "ai";

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();
  const result = streamText({
    model: anthropic("claude-sonnet-4-5-20250929"),
    system: "...emoji system prompt...",
    messages: await convertToModelMessages(messages),
  });
  return result.toUIMessageStreamResponse();
}

// Client component
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
const { messages, sendMessage } = useChat({
  transport: new DefaultChatTransport({ api: "/api/chat" }),
});
```

## Database (Drizzle + SQLite)

- **ORM**: Drizzle ORM with `better-sqlite3`, schema in `db/schema.ts`
- **DB file**: `./data/amelia.db` (override with `DATABASE_PATH` env var)
- **Schema change workflow**: Edit `db/schema.ts` → `npm run db:generate` → commit the migration SQL in `db/migrations/`
- **Apply migrations**: `npm run db:migrate` (runs `drizzle-kit migrate`) — run on every deploy
- **Seeding**: `npm run db:seed` (runs `tsx db/seed.ts`)
- **NEVER use `drizzle-kit push`** — it applies schema changes directly without a migration file, making them non-repeatable on production. There is no `db:push` script and one should never be added.

## Environment Variables

- `ANTHROPIC_API_KEY` — Required. Anthropic API access for chat/generation.
- `OPENAI_API_KEY` — Required. OpenAI embeddings + TTS.
- `SITE_PASSWORD` — Required. Single password protecting the site.
- `DATABASE_PATH` — Optional. SQLite DB path (default: `./data/amelia.db`).

## Conventions

- **Overlay components**: Use `useScrollLock`, `useEscapeKey`, `useCloseAnimation` hooks
- **Card pattern**: Export `{Name}Face` + `{Name}Content` for table object + modal content
- **CSS**: Use CSS variables from globals.css — never hardcode palette colors
- **Textures**: Use `.texture-paper` / `.texture-wood` global classes
- **Animations**: Put shared keyframes in `globals.css`, component-specific ones stay local
- **API routes**: Always wrap in try-catch, return descriptive error JSON

## Production (Render.com)

- **URL**: https://amelia.food
- **Host**: Render.com (personal account)
- **SSH**: `ssh srv-d66ir00gjchc7395c830@ssh.oregon.render.com`
- **SSH key**: Stored in 1Password as **"render.com personal SSH key"** (Ed25519). This key works for any machine on the personal Render account.
- **Retrieving the key for SSH access**:
  1. Open 1Password, find "render.com personal SSH key"
  2. Save the private key to `~/.ssh/render_ed25519`
  3. `chmod 600 ~/.ssh/render_ed25519`
  4. `ssh -i ~/.ssh/render_ed25519 srv-d66ir00gjchc7395c830@ssh.oregon.render.com`

## Testing

- Run `npm run dev` and verify at http://localhost:3000
- Use Chrome MCP tools to take snapshots and screenshots for visual verification
- Test both desktop viewport and mobile (390x844) viewport
