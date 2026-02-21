import { getDb } from "@/db/client";
import { words } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { WordDefinition } from "@/data/words";

export function getAllWords(): WordDefinition[] {
  return getDb().select().from(words).all() as WordDefinition[];
}

export function deleteWord(id: string): void {
  getDb().delete(words).where(eq(words.id, id)).run();
}
