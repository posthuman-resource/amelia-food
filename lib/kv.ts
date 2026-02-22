import { sql, like } from "drizzle-orm";
import { getDb } from "@/db/client";
import { kvStore } from "@/db/schema";

export function kvGet<T = Record<string, unknown>>(key: string): T | undefined {
  const row = getDb()
    .select()
    .from(kvStore)
    .where(sql`${kvStore.key} = ${key}`)
    .get();
  if (!row) return undefined;
  return JSON.parse(row.value) as T;
}

export function kvSet(key: string, value: Record<string, unknown>): void {
  const now = new Date().toISOString();
  const json = JSON.stringify(value);
  getDb()
    .insert(kvStore)
    .values({ key, value: json, updatedAt: now })
    .onConflictDoUpdate({
      target: kvStore.key,
      set: {
        value: sql`json_patch(${kvStore.value}, ${json})`,
        updatedAt: now,
      },
    })
    .run();
}

export function kvDelete(key: string): void {
  getDb()
    .delete(kvStore)
    .where(sql`${kvStore.key} = ${key}`)
    .run();
}

export function kvList<T = Record<string, unknown>>(
  prefix: string,
): Array<{ key: string; value: T; updatedAt: string }> {
  const rows = getDb()
    .select()
    .from(kvStore)
    .where(like(kvStore.key, `${prefix}%`))
    .all();
  return rows.map((r) => ({
    key: r.key,
    value: JSON.parse(r.value) as T,
    updatedAt: r.updatedAt,
  }));
}
