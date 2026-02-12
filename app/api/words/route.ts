import { db } from '@/db/client';
import { words } from '@/db/schema';

export async function POST(req: Request) {
  const word = await req.json();

  if (!word?.id || !word?.word) {
    return Response.json({ error: 'Invalid word data' }, { status: 400 });
  }

  db.insert(words)
    .values({
      id: word.id,
      word: word.word,
      partOfSpeech: word.partOfSpeech,
      pronunciation: word.pronunciation,
      description: word.description,
      parts: word.parts,
      literal: word.literal,
    })
    .onConflictDoNothing()
    .run();

  return Response.json({ ok: true });
}
