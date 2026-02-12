import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';

let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getDb() {
  if (!_db) {
    const dbPath = process.env.DATABASE_PATH || './data/amelia.db';
    const sqlite = new Database(dbPath);
    sqlite.pragma('journal_mode = WAL');
    _db = drizzle({ client: sqlite, schema });
  }
  return _db;
}
