import { getDb } from "@/db/client";
import { vennEntries } from "@/db/schema";

export type VennSection = "left" | "right" | "both";

export interface VennEntry {
  id: string;
  text: string;
  section: VennSection;
  createdAt: string;
}

export function getAllVennEntries(): VennEntry[] {
  return getDb().select().from(vennEntries).all() as VennEntry[];
}
