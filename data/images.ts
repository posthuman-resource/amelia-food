import type { StaticImageData } from "next/image";
import type { TablePosition } from "./types";
import wowStillListening from "./images/wow-still-listening.png";

export interface ImageCardData {
  id: string;
  title: string;
  emoji: string;
  src: StaticImageData;
  alt: string;
  table: TablePosition;
}

export const images: ImageCardData[] = [
  {
    id: "blip",
    title: "blip",
    emoji: "〰️",
    src: wowStillListening,
    alt: "wow, still listening",
    table: { x: 28, y: 18, rotation: 1.5 },
  },
];
