# amelia.food — Product & Design Primer

## What This Is

A personal website at `amelia.food` — a Valentine's Day gift for a woman named Amelia (Amy). It's a place where she can go to discover things over time. The creator (Mike) will add new items to it periodically. It needs to work beautifully on both mobile and desktop.

## The Concept: A Table

The homepage is a **top-down view of a table surface**. Think: looking down at a wooden desk, a kitchen table, a workbench. Objects are placed on the table, and she discovers them by exploring what's there. Over time, new objects will appear.

There is no navigation bar, no header, no "welcome" message, no app-shell UI. Just the table. Her name — "Amelia" — should appear somewhere subtle and handwritten-feeling, like it's been scratched or written on the table surface itself, or on a small tag, or the edge of a napkin.

### Desktop
- Top-down perspective of a table surface with natural texture (wood grain, linen, or warm paper-like material)
- Objects are spatially arranged on the surface — not in a grid, but placed naturally like someone set them down
- Objects have subtle shadows suggesting they sit on the surface with physical weight
- On hover: a gentle lift, slight rotation, maybe a faint warm glow — nothing flashy, the kind of thing you notice the second time you visit
- Generous breathing room between objects

### Mobile
- Same surface texture and feeling
- Objects stack/arrange vertically but still feel like you're looking down at a surface
- Touch interactions instead of hover — gentle press feedback
- The intimacy should increase on mobile since she'll likely be curled up on her couch with her phone

### Current Objects on the Table

**1. The Emoji Game** — represented as a physical object on the table. Maybe a small card, a box of tiles, a folded note that says something like "let's talk" or "🗣️" or just has a few emoji on it. Clicking/tapping opens the game.

**2. A Valentine** — an envelope, a folded letter, or a card. Clicking opens it to reveal a handwritten-style note from Mike. The note content will be provided separately — for now just build the container/interaction. Placeholder text is fine.

---

## The Emoji Game — "Fluent in Feelings" (or whatever name feels right)

### Context
Amelia is new to emoji communication. She recently learned what 🍑 and 🎂 mean. She confused 🌙 for a banana. She asked if 👌🏻 means "okay." She's a rhetorician who is genuinely fascinated by how meaning is made through these tiny symbols. This game teaches her the language playfully.

### How It Works
- An LLM (Claude Haiku, via the Anthropic API) sends messages composed **entirely of emoji** — no words at all
- The emoji messages convey a scenario, a feeling, a question, a little story, or a reaction
- Amelia responds using **only emoji**
- The LLM then reacts with more emoji, building a back-and-forth conversation
- After a few exchanges (or when she wants), she can ask "what just happened?" and the LLM will explain the conversation in words — what it was trying to say, what it interpreted from her responses, how the emoji carried meaning

### The Emoji Picker / Response Interface
- This is critical: she needs a **fast, delightful way to browse and select emoji**
- A large, visible palette of emoji — not hidden behind a tiny system picker
- **Type-to-filter**: she can start typing a word (like "happy" or "moon" or "banana") and the emoji filter instantly to show relevant options
- The filter should search emoji names AND common associations (e.g., typing "sad" shows 😢😞💔🥀🌧️ etc.)
- She can select multiple emoji to compose her response, see them building up in a composition area
- Send button to deliver her response
- The interface should feel like playing with letter tiles or fridge magnets — tactile, playful, a little messy in a good way

### LLM System Prompt (for the emoji-only Claude)
The LLM should be instructed to:
- Communicate ONLY in emoji, never use words (until she asks for an explanation)
- Start simple — single emoji or pairs — and gradually increase complexity as she engages
- Be warm, playful, a little bit funny, occasionally surprising
- Use emoji poetically, not just literally (e.g., 🌊🪞 for "reflection" or "deep thoughts")
- Respond to her emoji thoughtfully, building on what she sends
- When asked to explain, describe what was being communicated and why those emoji were chosen, and gently note what her responses seemed to convey — like a fun debrief of the conversation
- The tone should feel like a patient, witty friend teaching her a new language through immersion
- Occasionally reference things that might delight her: cats (🐱), yarn (🧶), ballet (🩰), books (📚), the moon/banana confusion (🌙🍌)

### Game UI Notes
- The conversation should scroll naturally, emoji messages appearing with a gentle animation
- LLM messages on one side, her responses on the other (but not in a rigid chat-app way — more organic)
- A "what just happened?" button always available, styled as a little question mark or a "translate" card
- Option to start a new conversation / clear and begin again
- No score, no winning, no gamification. It's a conversation, not a competition.

---

## Design Language

### Who Is Amelia?
She trained in classical ballet for 20 years. She was a chocolatier. She knits sweaters. She managed a coffee shop. She's a rhetorician who studies how meaning is made through language. She identifies deeply with the film Amélie — she orchestrates beautiful things for other people from behind the scenes. She wrote a college bio that said: "Amy lives near a park, plays with yarn, and has a profound appreciation for the potential in a blank piece of paper." Her cat is named Ted. She confused the moon emoji for a banana. She is deeply private, fiercely intelligent, quietly funny, and profoundly warm.

### Aesthetic Direction: "Warm Tactile Whimsy"
This is not a tech product. This is not minimalist-startup-clean. This is not loud. It is:

- **Warm** — like holding a mug of tea, like the color of old paper, like lamplight
- **Tactile** — it should feel like touching something real. Paper texture, wood grain, soft shadows. Physical.
- **Considered** — every detail intentional, like she would notice and appreciate it. The blank page energy — what's NOT there matters as much as what is.
- **Quietly playful** — dry humor underneath. Small surprises that reward close attention. A little odd in the best way.
- **Intimate** — this is a gift from one person to another. It should feel like opening something made by hand.

### Typography
- Primary/display: A warm serif with character — something like **Lora**, **Crimson Pro**, **Playfair Display**, or **EB Garamond**. It should feel literary without being stuffy.
- For the handwritten/personal elements (her name on the table, the valentine): a script or handwriting font that feels genuine, not performative. Something like **Caveat**, **Patrick Hand**, or similar.
- Body text (game explanations, etc.): A clean but warm sans-serif or keep the serif. Readability matters.

### Color Palette
- **Background/surface**: Warm cream, parchment, or soft linen tones (`#F5F0E8`, `#EDE8DF`, `#FAF7F2`)
- **Primary accent**: Deep plum or burgundy (`#6B2D5B`, `#8B3A62`, `#722F37`) — rich, warm, not aggressive
- **Secondary accent**: Forest green or deep teal (`#2D5B4B`, `#3A6B5B`) — grounding, natural
- **Warm highlight**: Burnt orange or terracotta (`#C4723A`, `#B85C38`) — like old book spines
- **Text**: Deep warm brown or charcoal, not pure black (`#3A3230`, `#2C2825`)
- **Subtle gold**: For small details, edges, gentle emphasis (`#C4A265`, `#B8956A`)

### Texture & Atmosphere
- The table surface should have visible texture — wood grain, linen weave, or aged paper
- Subtle noise/grain overlay on surfaces for warmth
- Soft, diffused shadows (not hard drop shadows) — like natural indoor light
- No harsh borders — use shadow and spacing to define areas
- If using cards or panels, they should feel like paper or cardstock sitting on the table

### Motion & Interaction
- Everything is gentle. No bouncing, no snapping, no aggressive transitions.
- Objects on the table: subtle float on hover, gentle shadow change, maybe a 1-2 degree rotation
- Page transitions: soft fade or a feeling of "turning something over"
- Emoji in the game: appear with a gentle pop or fade, like someone placing tiles down
- Loading states: a quiet pulse or a simple ellipsis, not a spinner

### What This Should NOT Feel Like
- A SaaS product
- A dating app
- A tech demo
- Pinterest
- Anything with a gradient background and rounded cards
- Anything that looks like it was made by AI without human thought

### What This SHOULD Feel Like
- Opening a handmade gift
- A quiet room with good light and a table with interesting things on it
- The inside of a really good independent bookshop
- A note left on the kitchen counter from someone who knows you well
- Finding something in a pocket you forgot was there

---

## Technical Notes

- **Framework**: Next.js (already initialized blank project)
- Hosted at `amelia.food`
- The Anthropic API calls for the emoji game go through a Next.js API route (`/api/chat`) — this keeps the API key server-side automatically. Set `ANTHROPIC_API_KEY` in `.env.local`.
- The emoji dataset should be comprehensive and bundled client-side for instant filtering — don't rely on an external API for emoji search. Use a static JSON or JS module with full emoji data including names, keywords, and common associations.
- Mobile-first responsive design
- Performance matters — this should feel instant and lightweight
- No analytics, no tracking, no cookies. This is a gift, not a product.
- Use CSS modules or a global CSS file with CSS variables for theming — no Tailwind, the design is too specific and tactile for utility classes
- Self-host fonts via `next/font/google` or local font files in `public/fonts/`
- Textures (wood grain, paper, linen) go in `public/assets/textures/`

## File Structure
```
├── app/
│   ├── layout.tsx              # Root layout, fonts, global styles
│   ├── page.tsx                # The Table — homepage
│   ├── globals.css             # CSS variables, textures, base styles
│   └── api/
│       └── chat/
│           └── route.ts        # Anthropic API proxy for emoji game
├── components/
│   ├── Table.tsx               # Table surface, object placement
│   ├── TableObject.tsx         # Individual object on the table (hover/tap interactions)
│   ├── EmojiGame.tsx           # Full game wrapper (conversation + picker)
│   ├── EmojiPicker.tsx         # Type-to-filter emoji palette
│   ├── EmojiComposer.tsx       # Composition area where selected emoji build up before sending
│   ├── Conversation.tsx        # Scrolling emoji exchange display
│   ├── Valentine.tsx           # The valentine letter / envelope interaction
│   └── Modal.tsx               # Shared modal/overlay for opening objects from the table
├── data/
│   └── emoji.ts                # Full emoji dataset with searchable metadata
├── lib/
│   └── anthropic.ts            # Server-side Anthropic client helper
├── public/
│   ├── assets/
│   │   └── textures/           # Wood grain, paper, linen background images
│   └── fonts/                  # Self-hosted fonts (if not using next/font)
└── .env.local                  # ANTHROPIC_API_KEY
```
