import { getDb } from "@/db/client";
import { words } from "@/db/schema";
import type { WordDefinition } from "@/data/words";
import { requireAuth } from "@/lib/auth";

export async function POST(req: Request) {
  const denied = await requireAuth();
  if (denied) return denied;

  const word: WordDefinition = await req.json();

  if (!word?.id || !word?.word) {
    return Response.json({ error: "Invalid word data" }, { status: 400 });
  }

  getDb()
    .insert(words)
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
