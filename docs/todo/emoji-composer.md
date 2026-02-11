# Build the EmojiComposer Component

## Objective

The composition area where selected emoji build up before sending. Like arranging fridge magnets or Scrabble tiles on a rack. She selects emoji from the picker and sees them accumulate here, then sends when ready.

## Requirements

- [x] Displays selected emoji in a horizontal row that wraps if needed
- [x] Emoji appear with a gentle "placed" animation when added
- [x] Individual emoji can be removed by tapping/clicking them (with a subtle remove animation)
- [x] Send button to submit the composed message
- [x] Clear/reset button to start over
- [x] Send button disabled when no emoji selected
- [x] The area should feel like a composition tray or workspace

## Technical Approach

### Key Files
- `components/EmojiComposer.tsx` — Composition area + send/clear buttons
- `components/EmojiComposer.module.css` — Tray styling, button states, animations

### Props
```typescript
interface EmojiComposerProps {
  selectedEmoji: string[];
  onRemove: (index: number) => void;
  onSend: () => void;
  onClear: () => void;
}
```

### Animation
Each emoji in the tray has a subtle entry animation (scale from 0.8 to 1, slight bounce). On remove, a quick fade out.

### Design Notes
- The tray sits between the conversation and the picker
- Background: slightly different paper tone to distinguish from conversation area
- Send button: `--color-plum` background, paper-white text, soft rounded corners
- Clear button: subtle, text-only, `--color-text-muted`
- Emoji in the tray should be at the same comfortable reading size as in the conversation
- If empty, show a gentle hint like "pick some emoji..." in muted text

## Acceptance Criteria

- [x] Selected emoji display in a horizontal row
- [x] Adding emoji shows entry animation
- [x] Tapping an emoji in the tray removes it
- [x] Send button works and is disabled when empty
- [x] Clear button resets the selection
- [x] Looks and feels like a physical composition workspace
