"use client";

import styles from "./TableObject.module.css";

export type TableObjectVariant =
  | "poem"
  | "page"
  | "image"
  | "emoji-game"
  | "valentine"
  | "welcome"
  | "word-stack"
  | "venn"
  | "lock"
  | "signal"
  | "transmission";

const noTextureVariants = new Set<TableObjectVariant>([
  "welcome",
  "word-stack",
  "image",
  "signal",
]);

interface TableObjectProps {
  id: string;
  x: number;
  y: number;
  rotation: number;
  index?: number;
  variant?: TableObjectVariant;
  label?: string;
  children: React.ReactNode;
  onClick?: () => void;
}

export default function TableObject({
  id,
  x,
  y,
  rotation,
  index = 0,
  variant,
  label,
  children,
  onClick,
}: TableObjectProps) {
  const variantClass = variant ? styles[variant] : undefined;
  const useTexture = !variant || !noTextureVariants.has(variant);
  const useDropShadow = variant === "page";

  const cardClasses = [styles.card, useTexture && "texture-paper", variantClass]
    .filter(Boolean)
    .join(" ");

  const objectClasses = [styles.object, useDropShadow && styles.dropShadow]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={objectClasses}
      data-object-id={id}
      style={
        {
          "--x": `${x}%`,
          "--y": `${y}%`,
          "--rotation": `${rotation}deg`,
          "--stagger": `${index * 100}ms`,
        } as React.CSSProperties
      }
    >
      <button
        className={cardClasses}
        onClick={onClick}
        type="button"
        aria-label={id}
      >
        {children}
      </button>
      {label && <p className={styles.label}>{label}</p>}
    </div>
  );
}
