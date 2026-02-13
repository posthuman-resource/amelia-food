import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export const words = sqliteTable("words", {
  id: text().primaryKey(),
  word: text().notNull(),
  partOfSpeech: text("part_of_speech").notNull(),
  pronunciation: text().notNull(),
  description: text().notNull(),
  parts: text({ mode: "json" })
    .notNull()
    .$type<{ german: string; english: string }[]>(),
  literal: text().notNull(),
});
