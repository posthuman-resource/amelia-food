import type { TablePosition } from "./types";

export interface Poem {
  id: string;
  title: string;
  emoji: string;
  text: string;
  author?: string;
  table: TablePosition;
}

export interface PoemMeta {
  id: string;
  title: string;
  emoji: string;
  author?: string;
  table: TablePosition;
}

export const poemMeta: PoemMeta[] = [
  {
    id: "dendrites",
    title: "dendrites",
    emoji: "🐸",
    table: { x: 20, y: 65, rotation: -1.5 },
  },
  {
    id: "moonlight",
    title: "by moonlight",
    emoji: "🍌",
    table: { x: 50, y: 80, rotation: 1.5 },
  },
  {
    id: "tomatoes",
    title: "tomatoes",
    emoji: "🍅",
    author: "Joy Sullivan",
    table: { x: 75, y: 70, rotation: 2 },
  },
  {
    id: "brass",
    title: "brass",
    emoji: "🎺",
    table: { x: 15, y: 42, rotation: -1 },
  },
];
