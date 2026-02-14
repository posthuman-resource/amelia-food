"use client";

import { useEffect, useCallback, useState } from "react";
import { createPortal } from "react-dom";
import styles from "./CardStack.module.css";
import { useMounted } from "../hooks/useMounted";

interface CardStackItem {
  id: string;
}

interface CardStackFaceProps {
  count: number;
  icon?: React.ReactNode;
  label?: string;
}

export function CardStackFace({ count, icon, label }: CardStackFaceProps) {
  return (
    <div className={styles.face}>
      <div className={styles.stack}>
        {/* Shadow cards behind */}
        {count > 1 && (
          <div className={`${styles.shadowCard} ${styles.shadowCard2}`} />
        )}
        {count > 0 && (
          <div className={`${styles.shadowCard} ${styles.shadowCard1}`} />
        )}
        {/* Top card preview */}
        <div className={styles.topCard}>
          <span className={styles.topCardIcon}>{icon}</span>
        </div>
      </div>
      {label && <p className={styles.label}>{label}</p>}
    </div>
  );
}

interface CardStackOverlayProps<T extends CardStackItem> {
  items: T[];
  renderCard: (item: T, index: number) => React.ReactNode;
  onCardClick: (id: string) => void;
  onClose: () => void;
  ariaLabel?: string;
}

export function CardStackOverlay<T extends CardStackItem>({
  items,
  renderCard,
  onCardClick,
  onClose,
  ariaLabel,
}: CardStackOverlayProps<T>) {
  const mounted = useMounted();
  const [closing, setClosing] = useState(false);

  const handleClose = useCallback(() => {
    setClosing(true);
    setTimeout(() => {
      onClose();
    }, 200);
  }, [onClose]);

  // Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") handleClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleClose]);

  // Prevent body scroll
  useEffect(() => {
    const scrollY = window.scrollY;
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";

    return () => {
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.left = "";
      document.body.style.right = "";
      window.scrollTo(0, scrollY);
    };
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div
      className={`${styles.overlay} ${closing ? styles.overlayClosing : ""}`}
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
    >
      {/* Backdrop */}
      <div className={styles.backdrop} onClick={handleClose} />

      {/* Close button */}
      <button
        className={styles.close}
        onClick={handleClose}
        aria-label="Close"
        type="button"
      >
        ×
      </button>

      {/* Fan of cards */}
      <div className={styles.fan}>
        {items.map((item, i) => (
          <button
            key={item.id}
            className={styles.fanCard}
            style={
              {
                "--fan-index": i,
                "--fan-total": items.length,
                "--fan-delay": `${i * 60}ms`,
              } as React.CSSProperties
            }
            onClick={() => onCardClick(item.id)}
            type="button"
          >
            <div className={`${styles.fanCardInner} texture-paper`}>
              {renderCard(item, i)}
            </div>
          </button>
        ))}
      </div>
    </div>,
    document.body,
  );
}
