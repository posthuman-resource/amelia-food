import { getDb } from "@/db/client";
import { vennEntries } from "@/db/schema";

export interface VennEntry {
  id: string;
  text: string;
  section: "left" | "right" | "both";
  createdAt: string;
}

export function getAllVennEntries(): VennEntry[] {
  return getDb().select().from(vennEntries).all() as VennEntry[];
}
