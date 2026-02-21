import Image from "next/image";
import type { ImageCardData } from "@/data/images";
import styles from "./ImageCard.module.css";

export function ImageCardFace({ image }: { image: ImageCardData }) {
  return (
    <div className={styles.card}>
      <span className={styles.icon}>{image.emoji}</span>
    </div>
  );
}

export function ImageCardContent({ image }: { image: ImageCardData }) {
  return (
    <div className={styles.content}>
      <Image
        src={image.src}
        alt={image.alt}
        placeholder="blur"
        className={styles.image}
      />
    </div>
  );
}
