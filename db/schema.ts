import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import type { WordPart } from "@/data/words";

export const vennEntries = sqliteTable("venn_entries", {
  id: text().primaryKey(),
  text: text().notNull(),
  section: text().notNull(), // "left" | "right" | "both"
  createdAt: text("created_at").notNull(),
});

export const words = sqliteTable("words", {
  id: text().primaryKey(),
  word: text().notNull(),
  partOfSpeech: text("part_of_speech").notNull(),
  pronunciation: text().notNull(),
  description: text().notNull(),
  parts: text({ mode: "json" }).notNull().$type<WordPart[]>(),
  literal: text().notNull(),
});
