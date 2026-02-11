# Build the EmojiPicker Component

## Objective

A large, visible, delightful emoji palette. The primer calls this "critical" — she needs a fast way to browse and select emoji, not hidden behind a tiny system picker. Type-to-filter is essential: typing "happy" or "moon" instantly filters to relevant emoji. Should feel like playing with letter tiles or fridge magnets.

## Requirements

- [ ] Grid of emoji, large enough to tap on mobile
- [ ] Type-to-filter search input at the top
- [ ] Search matches emoji names AND keyword associations (from emoji dataset)
- [ ] Instant filtering — no debounce lag, feels immediate
- [ ] Shows category groupings when not searching (Smileys, Animals, Food, etc.)
- [ ] Clicking/tapping an emoji adds it to the composer (calls onSelect callback)
- [ ] Visual feedback on selection (brief highlight/pop)
- [ ] Scrollable grid area with smooth scrolling
- [ ] Search input placeholder that's warm/inviting ("type a feeling...")

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

- [ ] Emoji grid renders with all common emoji
- [ ] Typing in search instantly filters emoji
- [ ] Search finds emoji by name ("grinning") and by association ("happy")
- [ ] Tapping an emoji fires onSelect with the emoji character
- [ ] Grid is scrollable and responsive
- [ ] Feels fast and tactile, not laggy
