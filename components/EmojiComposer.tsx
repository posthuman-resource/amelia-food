'use client';

import { useRef, useEffect } from 'react';
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

  // Scroll tray to end when new emoji are added
  useEffect(() => {
    if (selectedEmoji.length > prevLengthRef.current && trayRef.current) {
      trayRef.current.scrollLeft = trayRef.current.scrollWidth;
    }
    prevLengthRef.current = selectedEmoji.length;
  }, [selectedEmoji.length]);

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
              className={styles.tile}
              onClick={() => onRemove(index)}
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
