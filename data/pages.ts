export interface Page {
  id: string;
  title: string;
  emoji: string;
  text: string;
  table: { x: number; y: number; rotation: number };
}

export interface PageMeta {
  id: string;
  title: string;
  emoji: string;
  table: { x: number; y: number; rotation: number };
}

export const pageMeta: PageMeta[] = [
  {
    id: "booklist",
    title: "booklist",
    emoji: "📚",
    table: { x: 82, y: 55, rotation: 1.5 },
  },
];
