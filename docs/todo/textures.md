# Generate Table Surface Textures

## Objective

Create the warm, tactile table surface that forms the background of the entire experience. The table should feel like looking down at a real wooden desk or kitchen table — visible grain, subtle warmth, physical presence. This is what makes it feel handmade rather than digital.

## Requirements

- [ ] Create a wood grain texture for the table surface (CSS/SVG, no external image dependencies)
- [ ] Create a subtle paper/parchment texture for cards and overlays
- [ ] Create a noise/grain overlay for added warmth
- [ ] All textures should tile seamlessly
- [ ] Textures must be lightweight (SVG or CSS-generated preferred over large raster images)

## Technical Approach

Generate textures using inline SVG data URIs and CSS gradients. This avoids external dependencies and loads instantly.

### Wood Grain
Use layered CSS linear-gradients with slightly varying warm browns to simulate wood grain. Add subtle SVG noise for micro-texture.

### Paper/Parchment
Light warm tones with a faint SVG noise filter overlay. Used for cards, the valentine, and modal backgrounds.

### Noise Overlay
A small tiling SVG with `<feTurbulence>` for organic grain. Applied as a pseudo-element overlay at low opacity.

### Key Files
- `app/globals.css` — Texture CSS classes (`.texture-wood`, `.texture-paper`, `.texture-noise`)
- `public/assets/textures/` — Any generated SVG files if inline gets too large

### Design Notes
- Wood grain: warm browns in the `#8B7355` to `#6B5B45` range, with lighter `#A89070` highlights
- The grain direction should be horizontal (like a real table viewed from above)
- Noise overlay should be barely perceptible — just enough to break the digital flatness
- Paper texture: `--color-surface-light` (#FAF7F2) with very faint warm speckling

## Acceptance Criteria

- [ ] Table surface has visible, realistic-feeling wood grain texture
- [ ] Paper texture available for card/overlay backgrounds
- [ ] Noise overlay adds warmth without being distracting
- [ ] No external image downloads required — all CSS/SVG
- [ ] Looks good at both mobile and desktop sizes
