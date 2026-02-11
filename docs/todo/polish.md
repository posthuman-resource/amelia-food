# Animation & Polish Pass

## Objective

The final layer that makes this feel handmade and alive. Subtle animations, refined shadows, micro-interactions that reward close attention. "The kind of thing you notice the second time you visit."

## Requirements

- [ ] Table objects: subtle float on hover, shadow transition, 1-2 degree rotation shift
- [ ] Modal: smooth open/close with fade + scale
- [ ] Emoji messages: gentle pop/fade entry animation, staggered if multiple
- [ ] Emoji picker: individual emoji have micro hover/focus feedback
- [ ] Emoji composer: tiles enter with gentle scale animation, exit with fade
- [ ] Loading state for AI response: quiet pulse animation (not a spinner)
- [ ] Page load: objects on the table fade in with a slight stagger
- [ ] "Amelia" text: very subtle breathing animation (opacity pulse) or static with glow
- [ ] Smooth scroll behavior throughout
- [ ] All transitions use ease-out or custom bezier, ~200-300ms

## Technical Approach

### Key Files
- All component `.module.css` files
- `app/globals.css` — Global animation keyframes and transition variables

### Global Animation Variables
```css
:root {
  --transition-fast: 150ms ease-out;
  --transition-normal: 250ms ease-out;
  --transition-slow: 400ms ease-out;
  --bezier-gentle: cubic-bezier(0.25, 0.46, 0.45, 0.94);
}
```

### Key Animations
```css
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes gentlePop { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
@keyframes pulse { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; } }
@keyframes staggerIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
```

### Design Notes
- Less is more — if an animation is noticeable, it's probably too much
- Hover states should feel like a gentle breath, not a mechanical response
- The loading pulse for AI responses should use `--color-plum` at low opacity
- Stagger delays for table objects: 100ms between each
- Respect `prefers-reduced-motion` — disable animations for users who prefer it

## Acceptance Criteria

- [ ] All hover/touch interactions have smooth, gentle transitions
- [ ] Modal open/close animation is polished
- [ ] Emoji entry animations feel like placing tiles
- [ ] AI loading state is a quiet pulse, not a spinner
- [ ] Table objects stagger in on page load
- [ ] `prefers-reduced-motion` respected
- [ ] Nothing feels janky, sudden, or mechanical
