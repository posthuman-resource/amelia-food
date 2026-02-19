import type { TablePosition } from "./types";

export interface Page {
  id: string;
  title: string;
  emoji: string;
  text: string;
  table: TablePosition;
}

export interface PageMeta {
  id: string;
  title: string;
  emoji: string;
  table: TablePosition;
}

export const pageMeta: PageMeta[] = [
  {
    id: "booklist",
    title: "booklist",
    emoji: "📚",
    table: { x: 82, y: 55, rotation: 1.5 },
  },
  {
    id: "fieldwork",
    title: "fieldwork",
    emoji: "🔬",
    table: { x: 15, y: 15, rotation: -1.5 },
  },
];
