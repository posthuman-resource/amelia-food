# Mobile Responsiveness & Touch Interactions

## Objective

The primer says "the intimacy should increase on mobile." This isn't just about responsive breakpoints — it's about making the phone experience feel more personal and tactile. Touch interactions replace hover, objects stack naturally, and the emoji game is comfortable to use with thumbs.

## Requirements

- [x] Table objects stack vertically on mobile but still feel like they're on the table surface
- [x] Touch interactions: gentle press feedback instead of hover (scale on :active)
- [x] Emoji game layout fits comfortably in mobile viewport
- [x] Emoji picker grid cells large enough for thumb tapping (min 44px)
- [x] Emoji composer comfortable to use with one hand
- [x] Modal takes full viewport on mobile (edge to edge, top to bottom)
- [x] Text sizes comfortable on mobile (no squinting)
- [x] No horizontal scroll anywhere
- [x] Viewport meta tag set correctly in layout

## Technical Approach

### Key Files
- All component `.module.css` files — add `@media` queries
- `app/layout.tsx` — Verify viewport meta tag

### Breakpoints
```css
/* Mobile-first base styles */
/* Desktop enhancements */
@media (min-width: 768px) { ... }
@media (min-width: 1024px) { ... }
```

### Touch Specifics
```css
@media (hover: none) {
  /* Touch device styles — no hover states */
  .object:active { transform: scale(0.97); }
}
@media (hover: hover) {
  /* Desktop hover styles */
  .object:hover { transform: translateY(-4px); }
}
```

### Design Notes
- On mobile, the table becomes a vertically scrollable surface rather than a fixed viewport
- Objects should have slightly more shadow on mobile to enhance the "looking down at a table" feel
- The emoji game on mobile: picker takes about 40% of screen, conversation takes 40%, composer 20%
- Ensure safe area insets for notched phones

## Acceptance Criteria

- [x] Table layout responsive: spatial on desktop, vertical on mobile
- [x] Touch interactions work naturally on mobile
- [x] Emoji game fully usable on 390px wide viewport
- [x] No horizontal scrolling on any viewport size
- [x] Modal full-screen on mobile, centered card on desktop
