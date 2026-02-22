import { getDb } from "@/db/client";
import { transmissions } from "@/db/schema";
import { asc } from "drizzle-orm";

export interface Transmission {
  id: string;
  text: string;
  createdAt: string;
}

export function getTransmissions(): Transmission[] {
  return getDb()
    .select()
    .from(transmissions)
    .orderBy(asc(transmissions.createdAt))
    .all() as Transmission[];
}

export function createTransmission(text: string): Transmission {
  const entry: Transmission = {
    id: crypto.randomUUID(),
    text: text.trim(),
    createdAt: new Date().toISOString(),
  };
  getDb().insert(transmissions).values(entry).run();
  return entry;
}
