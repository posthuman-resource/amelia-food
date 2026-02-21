"use client";

import { useState } from "react";
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
    </div>
  );
}

interface CardStackOverlayProps<T extends CardStackItem> {
  items: T[];
  renderCard: (item: T, index: number) => React.ReactNode;
  onCardClick: (id: string) => void;
  onClose: () => void;
  onDeleteItem?: (id: string) => void;
  isItemDeletable?: (item: T) => boolean;
  deleteConfirmLabel?: string;
  ariaLabel?: string;
}

export function CardStackOverlay<T extends CardStackItem>({
  items,
  renderCard,
  onCardClick,
  onClose,
  onDeleteItem,
  isItemDeletable,
  deleteConfirmLabel = "remove this?",
  ariaLabel,
}: CardStackOverlayProps<T>) {
  const mounted = useMounted();
  const { closing, handleClose } = useCloseAnimation(onClose);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

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
        {items.map((item, i) => {
          const deletable =
            onDeleteItem && isItemDeletable ? isItemDeletable(item) : false;
          const isConfirming = confirmingId === item.id;

          return (
            <div
              key={item.id}
              className={styles.fanCard}
              style={
                {
                  "--fan-index": i,
                  "--fan-total": items.length,
                  "--fan-delay": `${i * 60}ms`,
                } as React.CSSProperties
              }
            >
              {deletable && !isConfirming && (
                <button
                  className={styles.deleteButton}
                  onClick={() => setConfirmingId(item.id)}
                  type="button"
                  aria-label="Delete"
                >
                  ×
                </button>
              )}
              <button
                className={styles.fanCardButton}
                onClick={() => {
                  if (!isConfirming) onCardClick(item.id);
                }}
                type="button"
              >
                <div className={`${styles.fanCardInner} texture-paper`}>
                  {isConfirming ? (
                    <div className={styles.confirmFace}>
                      <p className={styles.confirmText}>{deleteConfirmLabel}</p>
                      <div className={styles.confirmActions}>
                        <span
                          role="button"
                          tabIndex={0}
                          className={styles.confirmYes}
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteItem?.(item.id);
                            setConfirmingId(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.stopPropagation();
                              onDeleteItem?.(item.id);
                              setConfirmingId(null);
                            }
                          }}
                        >
                          yes
                        </span>
                        <span
                          role="button"
                          tabIndex={0}
                          className={styles.confirmNo}
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmingId(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.stopPropagation();
                              setConfirmingId(null);
                            }
                          }}
                        >
                          no
                        </span>
                      </div>
                    </div>
                  ) : (
                    renderCard(item, i)
                  )}
                </div>
              </button>
            </div>
          );
        })}
      </div>
    </div>,
    document.body,
  );
}
