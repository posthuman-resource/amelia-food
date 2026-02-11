# Build the EmojiPicker Component

## Objective

A large, visible, delightful emoji palette. The primer calls this "critical" — she needs a fast way to browse and select emoji, not hidden behind a tiny system picker. Type-to-filter is essential: typing "happy" or "moon" instantly filters to relevant emoji. Should feel like playing with letter tiles or fridge magnets.

## Requirements

- [x] Grid of emoji, large enough to tap on mobile
- [x] Type-to-filter search input at the top
- [x] Search matches emoji names AND keyword associations (from emoji dataset)
- [x] Instant filtering — no debounce lag, feels immediate
- [x] Shows category groupings when not searching (Smileys, Animals, Food, etc.)
- [x] Clicking/tapping an emoji adds it to the composer (calls onSelect callback)
- [x] Visual feedback on selection (brief highlight/pop)
- [x] Scrollable grid area with smooth scrolling
- [x] Search input placeholder that's warm/inviting ("type a feeling...")

## Technical Approach

### Key Files
- `components/EmojiPicker.tsx` — Search input + filterable emoji grid
- `components/EmojiPicker.module.css` — Grid layout, search styling, selection feedback
- `data/emoji.ts` — Imported emoji dataset

### Filtering Strategy
```typescript
function filterEmoji(query: string, dataset: EmojiEntry[]): EmojiEntry[] {
  const q = query.toLowerCase();
  return dataset.filter(e =>
    e.name.includes(q) || e.keywords.some(k => k.includes(q))
  );
}
```
For instant feel: filter on every keystroke (the dataset is small enough in memory).

### Grid Layout
CSS Grid with `auto-fill` and `minmax(44px, 1fr)` for responsive emoji cells. Each cell is a button for accessibility.

### Design Notes
- Search input should have paper texture background, warm border color
- Emoji grid should feel like a tray of letter tiles — slight gaps, tactile quality
- On hover/focus, individual emoji get a gentle warm glow or slight scale
- Category headers in the serif font, subtle dividers
- The picker should be the bottom portion of the emoji game modal
- Consider virtual scrolling only if performance is an issue (probably not needed for ~1500 emoji)

## Acceptance Criteria

- [x] Emoji grid renders with all common emoji
- [x] Typing in search instantly filters emoji
- [x] Search finds emoji by name ("grinning") and by association ("happy")
- [x] Tapping an emoji fires onSelect with the emoji character
- [x] Grid is scrollable and responsive
- [x] Feels fast and tactile, not laggy
