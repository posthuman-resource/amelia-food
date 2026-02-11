# Build the Table Homepage Component

## Objective

The homepage IS the table. A full-viewport top-down view of a textured surface with objects placed naturally on it. No nav, no header, no welcome message. Just a warm, inviting surface with things to discover. "Amelia" appears somewhere subtle and handwritten.

## Requirements

- [x] Full-viewport table surface using wood grain texture
- [x] "Amelia" rendered in Caveat font, positioned subtly (like scratched into the table or written on a small tag)
- [x] Object placement system — positions objects naturally (not in a grid) with breathing room
- [x] Desktop: objects spread spatially across the surface
- [x] Mobile: objects stack vertically but still feel like they're on the table surface
- [x] Two objects placed: the emoji game card and the valentine envelope
- [x] Noise overlay applied to the full surface for warmth

## Technical Approach

### Key Files
- `app/page.tsx` — Renders `<Table>` component
- `components/Table.tsx` — Table surface, object positioning, "Amelia" text
- `components/Table.module.css` — Styles for surface, layout, name

### Layout Strategy
Use CSS Grid or absolute positioning for desktop (objects at specific coordinates with slight rotations). On mobile, switch to a flex column with natural spacing. Object positions can be defined as data (percentages) so adding new objects later is easy.

### Object Position Data
```typescript
const objects = [
  { id: 'emoji-game', x: 35, y: 30, rotation: -2 },
  { id: 'valentine', x: 60, y: 55, rotation: 3 },
];
```

### Design Notes
- "Amelia" should be at ~0.3 opacity, slightly rotated, like it was idly written with a pen
- The table should extend edge to edge — no visible container or frame
- On very wide screens, objects should still cluster toward center with extra table surface visible at edges
- The table itself should feel like it extends beyond the viewport

## Acceptance Criteria

- [x] Full-viewport table surface with wood grain texture and noise overlay
- [x] "Amelia" visible in handwritten style, subtle and integrated
- [x] Two objects visible on the table (emoji game card, valentine envelope)
- [x] Objects positioned naturally with slight rotations
- [x] Responsive: spatial layout on desktop, vertical stack on mobile
