"use client";

import { createPortal } from "react-dom";
import styles from "./CardStack.module.css";
import { useMounted } from "../hooks/useMounted";
import { useScrollLock } from "../hooks/useScrollLock";
import { useEscapeKey } from "../hooks/useEscapeKey";
import { useCloseAnimation } from "../hooks/useCloseAnimation";

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
  const { closing, handleClose } = useCloseAnimation(onClose);

  useScrollLock(true);
  useEscapeKey(handleClose);

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
        data-neko-block="true"
      >
        ×
      </button>

      {/* Fan of cards */}
      <div className={styles.fan} data-neko-block="true">
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
