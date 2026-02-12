/**
 * Generate vector embeddings for all emoji in our dataset.
 *
 * Uses OpenAI text-embedding-3-small at 256 dimensions via the Vercel AI SDK.
 * Output is saved to data/emoji-embeddings.json and committed to the repo.
 *
 * Usage:  npx tsx scripts/generate-emoji-embeddings.ts
 * Requires: OPENAI_API_KEY in .env
 */

import { openai } from '@ai-sdk/openai';
import { embedMany } from 'ai';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

// We can't use the @/ path alias from tsx, so import the built dataset
// by evaluating the emoji module at runtime. Instead, we'll load the
// emojibase data directly — same logic as data/emoji.ts but standalone.
import rawData from 'emojibase-data/en/data.json' with { type: 'json' };

const MODEL_ID = 'text-embedding-3-small';
const DIMENSIONS = 256;
const BATCH_SIZE = 512; // OpenAI allows up to 2048 inputs per request

interface EmojiEmbeddingEntry {
  emoji: string;
  name: string;
  embedding: number[];
}

interface EmbeddingsFile {
  model: string;
  dimensions: number;
  count: number;
  entries: EmojiEmbeddingEntry[];
}

async function main() {
  // Filter to the same set we use in the picker (skip components, regional indicators)
  const emoji = rawData.filter(
    (e: { group?: number }) => e.group !== undefined && e.group !== 2,
  );

  console.log(`Embedding ${emoji.length} emoji with ${MODEL_ID} @ ${DIMENSIONS}d...`);

  // Prepare text inputs: "😀 grinning face"
  const texts = emoji.map((e: { emoji: string; label: string }) => `${e.emoji} ${e.label}`);

  // Batch the embeddings
  const allEmbeddings: number[][] = [];
  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(texts.length / BATCH_SIZE);
    console.log(`  Batch ${batchNum}/${totalBatches} (${batch.length} items)...`);

    const { embeddings } = await embedMany({
      model: openai.embedding(MODEL_ID, { dimensions: DIMENSIONS }),
      values: batch,
    });

    allEmbeddings.push(...embeddings);
  }

  // Build output
  const entries: EmojiEmbeddingEntry[] = emoji.map(
    (e: { emoji: string; label: string }, i: number) => ({
      emoji: e.emoji,
      name: e.label,
      embedding: allEmbeddings[i],
    }),
  );

  const output: EmbeddingsFile = {
    model: MODEL_ID,
    dimensions: DIMENSIONS,
    count: entries.length,
    entries,
  };

  const outPath = join(process.cwd(), 'data', 'emoji-embeddings.json');
  writeFileSync(outPath, JSON.stringify(output));
  const sizeMB = (Buffer.byteLength(JSON.stringify(output)) / 1024 / 1024).toFixed(1);
  console.log(`\nWrote ${entries.length} embeddings to ${outPath} (${sizeMB} MB)`);
}

main().catch((err) => {
  console.error('Failed:', err);
  process.exit(1);
});
