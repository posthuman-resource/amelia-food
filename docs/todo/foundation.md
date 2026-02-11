# Strip Tailwind & Set Up Project Foundation

## Objective

Remove Tailwind CSS and the default Create Next App scaffolding. Replace with CSS variables, custom fonts via `next/font/google`, and the warm tactile color palette from the primer. This is the base layer everything else builds on.

## Requirements

- [ ] Remove Tailwind and `@tailwindcss/postcss` from dependencies and config
- [ ] Remove `postcss.config.mjs` (or repurpose if needed)
- [ ] Rewrite `globals.css` with CSS variables for the full color palette, typography scale, and spacing
- [ ] Set up fonts in `layout.tsx`: Lora (display serif), Caveat (handwritten), clean sans-serif fallback
- [ ] Update `layout.tsx` metadata: title "amelia.food", no description (it's a gift, not SEO)
- [ ] Clear out `page.tsx` to a minimal placeholder
- [ ] Remove default Next.js SVGs from `public/` (next.svg, vercel.svg, etc.)
- [ ] Install project dependencies: `ai`, `@ai-sdk/anthropic`, `@ai-sdk/react`, `emojibase`

## Technical Approach

### Key Files
- `app/globals.css` — Full CSS variable system, base styles, font declarations
- `app/layout.tsx` — Font loading via `next/font/google`, metadata, body class
- `app/page.tsx` — Stripped to empty placeholder
- `package.json` — Remove tailwind deps, add AI SDK + emojibase
- `postcss.config.mjs` — Remove or simplify

### CSS Variables to Define
```css
:root {
  /* Surface */
  --color-surface: #F5F0E8;
  --color-surface-warm: #EDE8DF;
  --color-surface-light: #FAF7F2;

  /* Accents */
  --color-plum: #6B2D5B;
  --color-plum-light: #8B3A62;
  --color-burgundy: #722F37;
  --color-green: #2D5B4B;
  --color-green-light: #3A6B5B;
  --color-terracotta: #C4723A;
  --color-terracotta-dark: #B85C38;
  --color-gold: #C4A265;
  --color-gold-muted: #B8956A;

  /* Text */
  --color-text: #3A3230;
  --color-text-dark: #2C2825;
  --color-text-muted: #6B5E58;

  /* Typography */
  --font-serif: 'Lora', Georgia, serif;
  --font-hand: 'Caveat', cursive;
  --font-body: 'Lora', Georgia, serif;

  /* Shadows */
  --shadow-soft: 0 2px 8px rgba(44, 40, 37, 0.08);
  --shadow-lifted: 0 8px 24px rgba(44, 40, 37, 0.12);
}
```

## Acceptance Criteria

- [ ] `npm run build` succeeds with zero Tailwind references
- [ ] Page renders with warm cream background and Lora font
- [ ] No default Next.js branding visible
- [ ] AI SDK packages installed and importable
