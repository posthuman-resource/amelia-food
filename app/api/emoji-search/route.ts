import { openai } from '@ai-sdk/openai';
import { embed, cosineSimilarity } from 'ai';
import embeddingsData from '@/data/emoji-embeddings.json';

const MODEL_ID = 'text-embedding-3-small';
const DIMENSIONS = 256;
const DEFAULT_LIMIT = 30;

interface EmbeddingEntry {
  emoji: string;
  name: string;
  embedding: number[];
}

// Module-scope cache — loaded once, stays in memory
const entries: EmbeddingEntry[] = embeddingsData.entries;

export async function POST(req: Request) {
  const body = await req.json();
  const query: string = body.query?.trim();
  const limit: number = Math.min(body.limit ?? DEFAULT_LIMIT, 80);

  if (!query || query.length < 2) {
    return Response.json({ results: [] });
  }

  // Embed the user's query with the same model + dimensions
  const { embedding: queryEmbedding } = await embed({
    model: openai.embedding(MODEL_ID),
    value: query,
    providerOptions: { openai: { dimensions: DIMENSIONS } },
  });

  // Compute cosine similarity against all emoji
  const scored = entries.map((entry) => ({
    emoji: entry.emoji,
    name: entry.name,
    score: cosineSimilarity(queryEmbedding, entry.embedding),
  }));

  // Sort by similarity, take top N
  scored.sort((a, b) => b.score - a.score);
  const results = scored.slice(0, limit).filter((r) => r.score > 0.15);

  return Response.json({ results });
}
