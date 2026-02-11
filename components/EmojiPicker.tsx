'use client';

import { useState, useMemo, useRef, useCallback } from 'react';
import { emojiData, searchEmoji, type EmojiEntry } from '@/data/emoji';
import styles from './EmojiPicker.module.css';

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
}

/** Group the full dataset by category for the default (non-search) view. */
function groupByCategory(entries: EmojiEntry[]): Map<string, EmojiEntry[]> {
  const map = new Map<string, EmojiEntry[]>();
  for (const entry of entries) {
    let group = map.get(entry.group);
    if (!group) {
      group = [];
      map.set(entry.group, group);
    }
    group.push(entry);
  }
  return map;
}

const grouped = groupByCategory(emojiData);

export default function EmojiPicker({ onSelect }: EmojiPickerProps) {
  const [query, setQuery] = useState('');
  const [flash, setFlash] = useState<string | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const isSearching = query.trim().length > 0;

  const searchResults = useMemo(() => {
    if (!isSearching) return null;
    return searchEmoji(query, 80);
  }, [query, isSearching]);

  const handleSelect = useCallback(
    (emoji: string) => {
      onSelect(emoji);
      setFlash(emoji);
      setTimeout(() => setFlash(null), 300);
    },
    [onSelect],
  );

  return (
    <div className={styles.picker}>
      <div className={styles.searchWrap}>
        <input
          className={styles.search}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="type a feeling…"
          autoComplete="off"
          spellCheck={false}
        />
        {isSearching && (
          <button
            className={styles.clearBtn}
            onClick={() => setQuery('')}
            aria-label="Clear search"
            type="button"
          >
            ×
          </button>
        )}
      </div>

      <div className={styles.grid} ref={gridRef}>
        {isSearching ? (
          searchResults && searchResults.length > 0 ? (
            <div className={styles.section}>
              <div className={styles.tiles}>
                {searchResults.map((entry) => (
                  <button
                    key={entry.emoji}
                    className={`${styles.cell} ${flash === entry.emoji ? styles.pop : ''}`}
                    onClick={() => handleSelect(entry.emoji)}
                    title={entry.name}
                    type="button"
                  >
                    {entry.emoji}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className={styles.noResults}>
              <span className={styles.noResultsEmoji}>🔍</span>
              <p className={styles.noResultsText}>no emoji found</p>
            </div>
          )
        ) : (
          Array.from(grouped.entries()).map(([group, entries]) => (
            <div key={group} className={styles.section}>
              <h3 className={styles.categoryHeader}>{group}</h3>
              <div className={styles.tiles}>
                {entries.map((entry) => (
                  <button
                    key={entry.emoji}
                    className={`${styles.cell} ${flash === entry.emoji ? styles.pop : ''}`}
                    onClick={() => handleSelect(entry.emoji)}
                    title={entry.name}
                    type="button"
                  >
                    {entry.emoji}
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
