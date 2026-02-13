import { getDb } from "@/db/client";
import { words } from "@/db/schema";
import type { WordDefinition } from "@/data/words";

export function getAllWords(): WordDefinition[] {
  return getDb().select().from(words).all() as WordDefinition[];
}
