import { db } from '@/db/client';
import { words } from '@/db/schema';
import type { WordDefinition } from '@/data/words';

export function getAllWords(): WordDefinition[] {
  return db.select().from(words).all() as WordDefinition[];
}
