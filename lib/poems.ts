import fs from "fs";
import path from "path";
import { poemMeta } from "@/data/poems";
import type { Poem } from "@/data/poems";

export function getAllPoems(): Poem[] {
  const dir = path.join(process.cwd(), "data/poems");
  return poemMeta.map((meta) => {
    const text = fs
      .readFileSync(path.join(dir, `${meta.id}.md`), "utf-8")
      .trim();
    return { ...meta, text };
  });
}
