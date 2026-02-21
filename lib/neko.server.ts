import { getDb } from "@/db/client";
import { nekoNames } from "@/db/schema";
import { eq } from "drizzle-orm";
import { DEFAULT_NAMES, type NekoVariant } from "./neko";

export function getNekoNames(): Partial<Record<NekoVariant, string>> {
  const rows = getDb().select().from(nekoNames).all();
  const result: Partial<Record<NekoVariant, string>> = {};
  for (const row of rows) {
    result[row.variant as NekoVariant] = row.name;
  }
  return result;
}

export function setNekoName(variant: NekoVariant, name: string) {
  const trimmed = name.trim();
  const db = getDb();

  if (!trimmed || trimmed === DEFAULT_NAMES[variant]) {
    db.delete(nekoNames).where(eq(nekoNames.variant, variant)).run();
  } else {
    db.insert(nekoNames)
      .values({ variant, name: trimmed })
      .onConflictDoUpdate({ target: nekoNames.variant, set: { name: trimmed } })
      .run();
  }
}
