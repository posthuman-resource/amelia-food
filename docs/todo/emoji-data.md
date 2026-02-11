# Create the Emoji Dataset with Search Metadata

## Objective

Build a comprehensive, client-side searchable emoji dataset. The primer emphasizes this needs to be instant — no API calls, no loading. She should be able to type "happy" or "moon" or "cat" and immediately see relevant emoji. The search should go beyond exact name matching to include associations and concepts.

## Requirements

- [ ] Use `emojibase` package to source comprehensive emoji data
- [ ] Process into a flat, searchable structure at build time
- [ ] Each emoji entry includes: emoji character, name, keywords/tags, group/category
- [ ] Search covers: official name, keywords, AND common associations
- [ ] Add custom associations for richer search (e.g., "sad" matches 😢💔🥀🌧️, "food" matches 🍕🍰🍫)
- [ ] Dataset loads client-side as a static JS module (no runtime fetching)
- [ ] Reasonable size — include common emoji, exclude obscure flags/symbols if needed to keep bundle small

## Technical Approach

### Key Files
- `data/emoji.ts` — Processed emoji dataset, exported as typed array
- Build-time script or inline processing of emojibase data

### Data Structure
```typescript
interface EmojiEntry {
  emoji: string;       // The character: "😊"
  name: string;        // "smiling face with smiling eyes"
  keywords: string[];  // ["happy", "smile", "joy", "warm", ...]
  group: string;       // "Smileys & Emotion"
}
```

### Processing Strategy
1. Import emojibase English data + shortcodes
2. Merge official keywords with emojibase tags
3. Add a curated layer of custom associations (feelings, concepts, poetic uses)
4. Export as a typed constant array
5. Build a search function that does case-insensitive substring matching across name + all keywords

### Custom Associations to Add
Particularly relevant for the emoji game's poetic/playful nature:
- Emotional concepts: "love", "sad", "excited", "confused", "cozy"
- Her interests: "ballet", "knitting", "coffee", "chocolate", "cat", "book", "yarn"
- Poetic associations: "reflection" → 🪞🌊, "time" → ⏳🕰️, "dream" → 💭🌙✨

## Acceptance Criteria

- [ ] Dataset includes 1000+ common emoji with rich keyword data
- [ ] Searching "happy" returns relevant smileys, hearts, sunshine, etc.
- [ ] Searching "cat" returns all cat emoji plus related (yarn, paw, etc.)
- [ ] Searching "moon" returns moon phases AND the crescent moon
- [ ] Module is importable client-side with no async loading needed
- [ ] TypeScript types exported for use in picker components
