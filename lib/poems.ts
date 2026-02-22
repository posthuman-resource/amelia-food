import fs from "fs";
import path from "path";
import { poemMeta, poemPairs } from "@/data/poems";
import type { Poem, PoemPairMeta } from "@/data/poems";

export interface PoemPair extends PoemPairMeta {
  texts: [string, string];
}

export function getAllPoems(): Poem[] {
  const dir = path.join(process.cwd(), "data/poems");
  return poemMeta.map((meta) => {
    const text = fs
      .readFileSync(path.join(dir, `${meta.id}.md`), "utf-8")
      .trim();
    return { ...meta, text };
  });
}

export function getAllPoemPairs(): PoemPair[] {
  const dir = path.join(process.cwd(), "data/poems");
  return poemPairs.map((meta) => {
    const texts = meta.poemIds.map((id) =>
      fs.readFileSync(path.join(dir, `${id}.md`), "utf-8").trim(),
    ) as [string, string];
    return { ...meta, texts };
  });
}
