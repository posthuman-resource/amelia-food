# Build the Modal Overlay Component

## Objective

A shared modal/overlay that opens when table objects are clicked. It should feel like picking up an object from the table and bringing it closer — not like a popup. The table stays visible but dimmed underneath.

## Requirements

- [ ] Overlay dims the table surface behind it (warm-tinted, not cold gray)
- [ ] Content area uses paper texture, centered, with generous padding
- [ ] Smooth open animation: fade in + gentle scale from 0.95 to 1
- [ ] Smooth close animation: reverse of open
- [ ] Close on clicking the overlay background (outside content)
- [ ] Close on pressing Escape
- [ ] Close button: subtle, positioned top-right, feels like part of the design (not a generic X)
- [ ] Prevents body scroll when open
- [ ] Accessible: focus trap, aria attributes

## Technical Approach

### Key Files
- `components/Modal.tsx` — Portal-based modal component
- `components/Modal.module.css` — Overlay, content, animations

### Animation
```css
.overlay { background: rgba(58, 50, 48, 0.4); }

.content {
  animation: modalIn 300ms ease-out;
}

@keyframes modalIn {
  from { opacity: 0; transform: scale(0.95) translateY(8px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}
```

### Design Notes
- The overlay color should be warm (brown-tinted), not the typical cold black/gray
- Content panel has paper texture, rounded corners (subtle, like worn paper edges)
- Modal should take up most of the viewport on mobile, centered card on desktop
- Close button could be a small "fold" in the corner of the paper, or a subtle mark

## Acceptance Criteria

- [ ] Opens with smooth animation when triggered
- [ ] Closes on overlay click, Escape key, and close button
- [ ] Body scroll prevented while open
- [ ] Warm-tinted overlay, paper-textured content area
- [ ] Works on both mobile and desktop viewports
