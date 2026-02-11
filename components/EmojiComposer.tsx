'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import styles from './EmojiComposer.module.css';

interface EmojiComposerProps {
  selectedEmoji: string[];
  onRemove: (index: number) => void;
  onSend: () => void;
  onClear: () => void;
}

export default function EmojiComposer({
  selectedEmoji,
  onRemove,
  onSend,
  onClear,
}: EmojiComposerProps) {
  const trayRef = useRef<HTMLDivElement>(null);
  const prevLengthRef = useRef(selectedEmoji.length);
  const [removing, setRemoving] = useState<number | null>(null);

  // Scroll tray to end when new emoji are added
  useEffect(() => {
    if (selectedEmoji.length > prevLengthRef.current && trayRef.current) {
      trayRef.current.scrollLeft = trayRef.current.scrollWidth;
    }
    prevLengthRef.current = selectedEmoji.length;
  }, [selectedEmoji.length]);

  const handleRemove = useCallback((index: number) => {
    setRemoving(index);
    setTimeout(() => {
      setRemoving(null);
      onRemove(index);
    }, 150);
  }, [onRemove]);

  const isEmpty = selectedEmoji.length === 0;

  return (
    <div className={styles.composer}>
      <div className={styles.tray} ref={trayRef}>
        {isEmpty ? (
          <span className={styles.hint}>pick some emoji…</span>
        ) : (
          selectedEmoji.map((emoji, index) => (
            <button
              key={`${emoji}-${index}`}
              className={`${styles.tile} ${removing === index ? styles.tileRemoving : ''}`}
              onClick={() => handleRemove(index)}
              title="Remove"
              type="button"
            >
              {emoji}
            </button>
          ))
        )}
      </div>
      <div className={styles.actions}>
        <button
          className={styles.clearBtn}
          onClick={onClear}
          disabled={isEmpty}
          type="button"
        >
          clear
        </button>
        <button
          className={styles.sendBtn}
          onClick={onSend}
          disabled={isEmpty}
          type="button"
        >
          send
        </button>
      </div>
    </div>
  );
}
