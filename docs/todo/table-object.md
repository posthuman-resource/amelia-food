# Build the TableObject Component

## Objective

Each item on the table is a TableObject — a physical-feeling card, envelope, or artifact with subtle shadows that suggest weight and presence. On hover (desktop) or press (mobile), it gently lifts and invites interaction. Clicking opens the associated content in a modal.

## Requirements

- [x] Renders as a paper/cardstock card sitting on the table surface
- [x] Soft, diffused shadow suggesting the object sits on the surface
- [x] Desktop hover: gentle lift (translateY), slight additional rotation (1-2deg), shadow deepens
- [x] Mobile: gentle press feedback on touch (slight scale)
- [x] Accepts `rotation` prop for initial slight tilt
- [x] Accepts `children` for the visual content of the object (card face)
- [x] Calls `onClick` handler when clicked/tapped (to open modal)
- [x] Paper texture background on the card surface

## Technical Approach

### Key Files
- `components/TableObject.tsx` — Component logic
- `components/TableObject.module.css` — Hover states, shadows, transitions

### Interaction Model
```
Rest state:    transform: rotate(var(--rotation)) translateY(0)
               box-shadow: var(--shadow-soft)

Hover state:   transform: rotate(calc(var(--rotation) + 1.5deg)) translateY(-4px)
               box-shadow: var(--shadow-lifted)

Active state:  transform: rotate(var(--rotation)) translateY(-1px) scale(0.98)
```

All transitions use `ease-out` timing, ~200ms duration.

### Design Notes
- Cards should look like thick paper or cardstock — slightly off-white with paper texture
- No hard borders — use shadow and subtle edge variation only
- The emoji game card shows a few emoji on its face (like decorative tiles)
- The valentine shows an envelope shape or a sealed letter
- Objects should feel like you could pick them up

## Acceptance Criteria

- [x] Object has realistic soft shadow on the table surface
- [x] Hover lifts the object with smooth transition (desktop)
- [x] Touch provides press feedback (mobile)
- [x] Paper texture visible on the card surface
- [x] onClick handler fires correctly
