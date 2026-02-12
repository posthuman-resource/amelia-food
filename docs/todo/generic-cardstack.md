# Generic CardStack Component

## Objective

Decouple CardStack from word card data so it can stack and fan any arbitrary set of cards. The component should know nothing about WordDefinition — it just renders a stack on the table and fans out cards in an overlay, delegating all card content to the consumer via render props.

## Current Coupling

`CardStack.tsx` directly imports `WordCardFace` and `WordDefinition`:
- `CardStackOverlayProps.words` is typed `WordDefinition[]`
- `onCardClick` passes `word.id` (word-specific)
- `CardStackFace` hardcodes "Aa" icon and "wortschatz" label
- Fan renders `<WordCardFace word={word} />` inline
- `aria-label="Word cards"` hardcoded

## Requirements

- [ ] Replace `words: WordDefinition[]` with a generic `items` array (just needs `id: string`)
- [ ] Accept a `renderCard` prop to render each fanned card's content
- [ ] Accept `icon` and `label` props for the table-face appearance (instead of hardcoded "Aa" / "wortschatz")
- [ ] Accept an `ariaLabel` prop for the overlay (instead of hardcoded "Word cards")
- [ ] `onCardClick` should pass the generic item id, not assume word semantics
- [ ] Remove all imports of `WordCardFace` and `WordDefinition` from CardStack
- [ ] Move word-specific rendering (`<WordCardFace>`, aria labels) to the consumer in `Table.tsx`
- [ ] No visual or behavioral changes — the word cards should look and work identically after refactoring

## Technical Approach

### New CardStack API

```tsx
// Generic item — just needs an id, consumer can pass richer objects
interface CardStackItem {
  id: string;
}

interface CardStackFaceProps {
  count: number;
  icon?: React.ReactNode;   // defaults to "Aa" or similar generic
  label?: string;            // defaults to nothing
}

interface CardStackOverlayProps<T extends CardStackItem> {
  items: T[];
  renderCard: (item: T, index: number) => React.ReactNode;
  onCardClick: (id: string) => void;
  onClose: () => void;
  ariaLabel?: string;
}
```

### Consumer in Table.tsx

```tsx
<CardStackOverlay
  items={words}
  renderCard={(word) => <WordCardFace word={word} />}
  onCardClick={(id) => setActiveObject(`word-${id}`)}
  onClose={() => setStackFanned(false)}
  ariaLabel="Word cards"
/>

<CardStackFace count={words.length} icon={<span>Aa</span>} label="wortschatz" />
```

### Key Files

- `components/CardStack.tsx` — generify props, remove word imports
- `components/Table.tsx` — pass render props and word-specific content

## Acceptance Criteria

- [ ] `CardStack.tsx` has zero imports from `WordCard` or `data/words`
- [ ] `CardStackOverlay` accepts arbitrary items with a `renderCard` prop
- [ ] `CardStackFace` accepts `icon` and `label` props
- [ ] Word cards render identically (visual regression: no changes)
- [ ] `npm run build` passes with no errors
