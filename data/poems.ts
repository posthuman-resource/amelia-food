export interface Poem {
  id: string;
  title: string;
  emoji: string;
  text: string;
  table: { x: number; y: number; rotation: number };
}

export interface PoemMeta {
  id: string;
  title: string;
  emoji: string;
  table: { x: number; y: number; rotation: number };
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
];
