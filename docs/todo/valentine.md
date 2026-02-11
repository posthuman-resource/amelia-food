# Build the Valentine Card Component

## Objective

A Valentine's Day letter/card from Mike. On the table, it appears as a sealed envelope. When opened (via modal), it reveals a handwritten-style note. The content is placeholder for now — Mike will provide the real text later.

## Requirements

- [ ] Table appearance: an envelope or folded letter sitting on the table
- [ ] The envelope has a slight "sealed" quality — maybe a small wax-seal-style circle or a fold
- [ ] When opened (modal), shows a letter/card with handwritten-style text
- [ ] Text rendered in Caveat font (handwriting feel)
- [ ] Placeholder text that feels appropriate (warm, short, personal-placeholder)
- [ ] The letter has paper texture and soft edges
- [ ] Optional: a subtle "opening" animation when the modal appears (envelope flap lifting)

## Technical Approach

### Key Files
- `components/Valentine.tsx` — Envelope on table + letter content in modal
- `components/Valentine.module.css` — Envelope shape, letter styling

### Envelope Design (CSS)
Build the envelope shape with CSS — a rectangle with a triangular flap. Use the paper texture with a slightly warmer/aged tint. The seal could be a small circle in `--color-plum` or `--color-gold`.

### Letter Content
```
Amelia,

[placeholder — something about finding things here over time,
 that this is a small corner of the internet just for her]

— Mike
```

### Design Notes
- The envelope on the table should look like a real envelope — slightly off-white, with a visible flap
- The wax seal (if used) should be `--color-plum` or `--color-burgundy`
- Inside, the letter should have generous line-height, the handwriting font at a comfortable size
- The letter paper should be slightly different from the envelope — maybe a cream notecard
- This is the most emotionally direct object — the design should be simple and warm

## Acceptance Criteria

- [ ] Envelope visible on the table with realistic shadow
- [ ] Clicking opens modal with the letter
- [ ] Letter text in Caveat (handwriting) font
- [ ] Paper texture and warm styling on the letter
- [ ] Placeholder text present and easily replaceable
