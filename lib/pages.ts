import fs from "fs";
import path from "path";
import { pageMeta } from "@/data/pages";
import type { Page } from "@/data/pages";

export function getAllPages(): Page[] {
  const dir = path.join(process.cwd(), "data/pages");
  return pageMeta.map((meta) => {
    const text = fs
      .readFileSync(path.join(dir, `${meta.id}.md`), "utf-8")
      .trim();
    return { ...meta, text };
  });
}
