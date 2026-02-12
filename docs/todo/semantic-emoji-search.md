# Semantic Emoji Search — DONE

## What We Built

Hybrid search in the EmojiPicker: instant keyword search (client-side) + debounced semantic search (server-side via OpenAI embeddings). Type a concept like "something to eat" and get relevant emoji, even when those words don't appear in any emoji metadata.

## Architecture

```
User types "something to eat"
  ├── INSTANT: keyword search (existing, client-side) → no results
  └── DEBOUNCED 300ms: POST /api/emoji-search { query }
        ├── Server embeds query via OpenAI text-embedding-3-small (256d)
        ├── Server loads pre-computed emoji embeddings (module-cached)
        ├── Server computes cosineSimilarity against all 1,914 emoji
        └── Returns top-N ranked results → 🍲🥭🥘🥣🍽️...
```

Keyword search stays instant and client-side. Semantic results merge in after ~300ms under a "related" section header with a gentle fade-in animation. The search bar shows a subtle shimmer while semantic results load.

## Key Decisions

- **OpenAI text-embedding-3-small** at 256 dimensions — excellent quality, tiny cost (~$0.0003 to embed all emoji, ~$0.000001 per query)
- **Server-side search** — embedding the query requires an API call anyway; cosine similarity over 1,914 vectors at 256d takes <5ms, no vector DB needed
- **Embed `"🎉 party popper"`** (emoji char + label) — modern embedding models understand emoji characters semantically
- **`@ai-sdk/openai@1.3.24`** — pinned to v1.x for compatibility with `ai@4.x` (Vercel AI SDK v4)
- **Similarity threshold 0.15** — filters out noise at the bottom of results

## Files

| File | Purpose |
|------|---------|
| `scripts/generate-emoji-embeddings.ts` | One-time build script using `embedMany()` |
| `data/emoji-embeddings.json` | 1,914 pre-computed embeddings (5.8MB, server-only) |
| `app/api/emoji-search/route.ts` | POST endpoint: embed query → cosine similarity → top-N |
| `components/EmojiPicker.tsx` | Hybrid search: instant keyword + debounced semantic |
| `components/EmojiPicker.module.css` | Loading shimmer + semantic fade-in animation |

## Regenerating Embeddings

```bash
# Requires OPENAI_API_KEY in .env
npx tsx scripts/generate-emoji-embeddings.ts
```
