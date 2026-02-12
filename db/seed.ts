import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { db } from './client';
import { words as wordsTable } from './schema';
import { words as wordData } from '../data/words';

// Apply pending migrations (creates tables if needed)
migrate(db, { migrationsFolder: './db/migrations' });

// Seed words — idempotent via onConflictDoNothing
for (const word of wordData) {
  db.insert(wordsTable)
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
}

console.log(`Seeded ${wordData.length} words`);
process.exit(0);
