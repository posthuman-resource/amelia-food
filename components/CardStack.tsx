'use client';

import { useEffect, useCallback, useState } from 'react';
import { createPortal } from 'react-dom';
import { WordCardFace } from './WordCard';
import type { WordDefinition } from '@/data/words';
import styles from './CardStack.module.css';

export function CardStackFace({ count }: { count: number }) {
  return (
    <div className={styles.face}>
      <div className={styles.stack}>
        {/* Shadow cards behind */}
        {count > 1 && <div className={`${styles.shadowCard} ${styles.shadowCard2}`} />}
        {count > 0 && <div className={`${styles.shadowCard} ${styles.shadowCard1}`} />}
        {/* Top card preview */}
        <div className={styles.topCard}>
          <span className={styles.topCardIcon}>Aa</span>
        </div>
      </div>
      <p className={styles.label}>wortschatz</p>
    </div>
  );
}

interface CardStackOverlayProps {
  words: WordDefinition[];
  onCardClick: (wordId: string) => void;
  onClose: () => void;
}

export function CardStackOverlay({ words, onCardClick, onClose }: CardStackOverlayProps) {
  const [mounted, setMounted] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleClose = useCallback(() => {
    setClosing(true);
    setTimeout(() => {
      onClose();
    }, 200);
  }, [onClose]);

  // Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') handleClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleClose]);

  // Prevent body scroll
  useEffect(() => {
    const scrollY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';

    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      window.scrollTo(0, scrollY);
    };
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div
      className={`${styles.overlay} ${closing ? styles.overlayClosing : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label="Word cards"
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
        {words.map((word, i) => (
          <button
            key={word.id}
            className={styles.fanCard}
            style={{
              '--fan-index': i,
              '--fan-total': words.length,
              '--fan-delay': `${i * 60}ms`,
            } as React.CSSProperties}
            onClick={() => onCardClick(word.id)}
            type="button"
            aria-label={word.word}
          >
            <div className={`${styles.fanCardInner} texture-paper`}>
              <WordCardFace word={word} />
            </div>
          </button>
        ))}
      </div>
    </div>,
    document.body
  );
}
