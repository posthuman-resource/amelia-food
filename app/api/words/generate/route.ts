import { anthropic } from '@ai-sdk/anthropic';
import { generateObject, jsonSchema } from 'ai';
import {
  WORD_GENERATION_SYSTEM_PROMPT,
  wordGenerationPrompt,
} from '@/lib/prompts';

export const maxDuration = 60;

const wordSchema = jsonSchema<{
  words: {
    id: string;
    word: string;
    partOfSpeech: string;
    pronunciation: string;
    description: string;
    parts: { german: string; english: string }[];
    literal: string;
  }[];
}>({
  type: 'object',
  additionalProperties: false,
  properties: {
    words: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          id: { type: 'string', description: 'Lowercase kebab-case slug of the word' },
          word: { type: 'string', description: 'The German compound word, capitalized' },
          partOfSpeech: { type: 'string', description: 'Part of speech, usually "n."' },
          pronunciation: { type: 'string', description: 'IPA pronunciation between slashes' },
          description: { type: 'string', description: 'Warm, precise description (1-3 sentences)' },
          parts: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              properties: {
                german: { type: 'string', description: 'German morpheme' },
                english: { type: 'string', description: 'English translation of the morpheme' },
              },
              required: ['german', 'english'],
            },
            description: 'Morpheme breakdown of the compound word',
          },
          literal: { type: 'string', description: 'Poetic literal translation, prefixed with "the"' },
        },
        required: ['id', 'word', 'partOfSpeech', 'pronunciation', 'description', 'parts', 'literal'],
      },
      description: 'Exactly 4 invented German compound words',
    },
  },
  required: ['words'],
});

export async function POST(req: Request) {
  const { feeling, excludeWords } = await req.json();

  if (!feeling || typeof feeling !== 'string' || feeling.trim().length < 20) {
    return Response.json(
      { error: 'Please describe the feeling in at least 20 characters.' },
      { status: 400 },
    );
  }

  try {
    const { object } = await generateObject({
      model: anthropic('claude-opus-4-6'),
      schema: wordSchema,
      system: WORD_GENERATION_SYSTEM_PROMPT,
      prompt: wordGenerationPrompt(feeling.trim(), excludeWords),
    });

    return Response.json(object);
  } catch (err) {
    console.error('Word generation failed:', err);
    return Response.json(
      { error: 'Failed to generate words. Please try again.' },
      { status: 500 },
    );
  }
}
