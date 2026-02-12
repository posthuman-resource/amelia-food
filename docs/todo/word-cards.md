# Word Cards — German Compound Words on the Table

## Objective

Add a new reusable component for displaying invented German compound words — beautiful, untranslatable words that capture feelings too specific for any real dictionary. Each word gets a card on the table that opens into a typographic modal showing the word, its pronunciation, definition, etymology, and a "use naturally" button that generates a sentence using the word and speaks it aloud via OpenAI TTS.

## Requirements

- [x] Create `data/words.ts` with word definitions data structure
- [x] Create reusable `WordCard` component (face + modal content)
- [x] Add two word cards to the table surface
- [x] Word card face: shows the word elegantly on a small card
- [x] Word card modal: displays word, pronunciation, definition, parts breakdown, literal translation
- [x] "Use naturally" button that generates a sentence with the word via OpenAI and speaks it aloud
- [x] API route for sentence generation + text-to-speech
- [x] Audio playback on the client with loading state
- [x] Mobile responsive

## Words

### 1. Bildschirmumarmungsversuch

- **Part of speech:** (n.)
- **Pronunciation:** /ˈbɪlt.ʃɪʁm.ʊm.ˈʔaʁ.mʊŋs.fɛɐ̯.ˈzuːx/
- **Definition:** The futile but earnest attempt to transmit a hug through a screen to someone on the other side of the internet — the physical act of wanting to reach through the glass and hold someone you can only see in pixels and feel in words.
- **Parts:** Bildschirm (screen), Umarmung (embrace, hug), Versuch (attempt, try)
- **Literal:** the screen-embrace-attempt

### 2. Schonimmerteilbegegnung

- **Part of speech:** (n.)
- **Pronunciation:** /ʃoːn.ˈɪ.mɐ.taɪl.bə.ˈɡeːɡ.nʊŋ/
- **Definition:** The encounter with someone who was always already part of you — a meeting that feels not like a beginning, but like a recognition. The quiet, startling moment when you realize the person in front of you has been carrying a piece of you long before you ever crossed paths.
- **Parts:** schon (already), immer (always), Teil (part, piece), Begegnung (encounter, meeting)
- **Literal:** the already-always-part-encounter

## Technical Approach

### Data Model

```typescript
interface WordDefinition {
  id: string;
  word: string;
  partOfSpeech: string;
  pronunciation: string;
  description: string;
  parts: { german: string; english: string }[];
  literal: string;
}
```

### Component Architecture

Following the Valentine.tsx pattern of exporting face + content components:

- `WordCardFace({ word })` — table surface: the word displayed in serif with a subtle label
- `WordCardContent({ word })` — modal: full typographic card with all fields + audio button

### "Use Naturally" Flow

1. User clicks play button in modal
2. Client POSTs to `/api/word-audio` with the word data
3. Server generates a sentence using OpenAI (`generateText` with `gpt-4o-mini`)
4. Server generates speech using `experimental_generateSpeech` with `openai.speech('gpt-4o-mini-tts')`
5. Returns `{ sentence: string, audio: base64 }`
6. Client displays sentence, decodes audio, plays via `Audio` API

**Depends on AI SDK v6 upgrade** for `experimental_generateSpeech`.

### Key Files

- `data/words.ts` — word definitions array
- `components/WordCard.tsx` + `components/WordCard.module.css` — reusable component
- `app/api/word-audio/route.ts` — sentence generation + TTS endpoint
- `components/Table.tsx` — add two word objects to the table

### Design Notes

- Word on table face: Lora serif, slightly smaller than other card labels, the word itself is the visual hook
- Modal: clean typographic hierarchy — word large in Lora, pronunciation in monospace (Courier Prime), definition in body text, parts as a subtle breakdown, literal translation in Caveat (handwritten)
- "Use naturally" button: gentle, not prominent — a small play icon with warm styling
- Audio loading: subtle pulsing animation on the button, not a spinner
- Sentence display: appears below the button in italic after generation
- Needs `OPENAI_API_KEY` in `.env` for TTS

## Acceptance Criteria

- [x] Two word cards visible on the table surface
- [x] Clicking a word card opens modal with full definition
- [x] Phonetics render correctly (IPA characters intact)
- [ ] "Use naturally" button generates a sentence and plays audio
- [ ] Audio plays on both desktop and mobile
- [x] Loading state visible while generating
- [x] Component is reusable (adding a new word = adding data to `words.ts`)
- [x] `npm run build` succeeds
