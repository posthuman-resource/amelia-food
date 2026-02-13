"use client";

import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { emojiData, searchEmoji, type EmojiEntry } from "@/data/emoji";
import styles from "./EmojiPicker.module.css";

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
}

interface SemanticResult {
  emoji: string;
  name: string;
  score: number;
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

/** Lookup table: emoji char → EmojiEntry (for merging semantic results) */
const emojiLookup = new Map<string, EmojiEntry>();
for (const entry of emojiData) {
  emojiLookup.set(entry.emoji, entry);
}

const grouped = groupByCategory(emojiData);

export default function EmojiPicker({ onSelect }: EmojiPickerProps) {
  const [query, setQuery] = useState("");
  const [flash, setFlash] = useState<string | null>(null);
  const [semanticResults, setSemanticResults] = useState<
    SemanticResult[] | null
  >(null);
  const [semanticLoading, setSemanticLoading] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const isSearching = query.trim().length > 0;

  // Instant keyword search (unchanged)
  const keywordResults = useMemo(() => {
    if (!isSearching) return null;
    return searchEmoji(query, 80);
  }, [query, isSearching]);

  // Debounced semantic search
  useEffect(() => {
    const trimmed = query.trim();

    // Clear semantic results when query is empty or too short
    if (trimmed.length < 2) {
      setSemanticResults(null);
      setSemanticLoading(false);
      return;
    }

    setSemanticLoading(true);

    const timer = setTimeout(async () => {
      // Cancel any in-flight request
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch("/api/emoji-search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: trimmed, limit: 40 }),
          signal: controller.signal,
        });

        if (!res.ok) throw new Error("search failed");

        const data = await res.json();
        if (!controller.signal.aborted) {
          setSemanticResults(data.results);
          setSemanticLoading(false);
        }
      } catch {
        if (!controller.signal.aborted) {
          setSemanticResults(null);
          setSemanticLoading(false);
        }
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      abortRef.current?.abort();
    };
  }, [query]);

  // Merge keyword + semantic results
  const mergedResults = useMemo(() => {
    if (!isSearching) return null;

    const keyword = keywordResults ?? [];
    const seen = new Set(keyword.map((e) => e.emoji));

    // Semantic-only results (not already in keyword results)
    const semanticOnly: EmojiEntry[] = [];
    if (semanticResults) {
      for (const sr of semanticResults) {
        if (!seen.has(sr.emoji)) {
          const entry = emojiLookup.get(sr.emoji);
          if (entry) {
            semanticOnly.push(entry);
            seen.add(sr.emoji);
          }
        }
      }
    }

    return { keyword, semanticOnly };
  }, [isSearching, keywordResults, semanticResults]);

  const handleSelect = useCallback(
    (emoji: string) => {
      onSelect(emoji);
      setFlash(emoji);
      setTimeout(() => setFlash(null), 300);
    },
    [onSelect],
  );

  const hasAnyResults =
    mergedResults &&
    (mergedResults.keyword.length > 0 || mergedResults.semanticOnly.length > 0);

  return (
    <div className={styles.picker}>
      <div className={styles.searchWrap}>
        <input
          className={`${styles.search} ${semanticLoading ? styles.searchLoading : ""}`}
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
            onClick={() => {
              setQuery("");
              setSemanticResults(null);
            }}
            aria-label="Clear search"
            type="button"
          >
            ×
          </button>
        )}
      </div>

      <div className={styles.grid} ref={gridRef}>
        {isSearching ? (
          hasAnyResults ? (
            <>
              {mergedResults.keyword.length > 0 && (
                <div className={styles.section}>
                  <div className={styles.tiles}>
                    {mergedResults.keyword.map((entry) => (
                      <button
                        key={entry.emoji}
                        className={`${styles.cell} ${flash === entry.emoji ? styles.pop : ""}`}
                        onClick={() => handleSelect(entry.emoji)}
                        title={entry.name}
                        type="button"
                      >
                        {entry.emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {mergedResults.semanticOnly.length > 0 && (
                <div className={styles.section}>
                  <h3 className={styles.categoryHeader}>related</h3>
                  <div className={`${styles.tiles} ${styles.semanticTiles}`}>
                    {mergedResults.semanticOnly.map((entry) => (
                      <button
                        key={entry.emoji}
                        className={`${styles.cell} ${flash === entry.emoji ? styles.pop : ""}`}
                        onClick={() => handleSelect(entry.emoji)}
                        title={entry.name}
                        type="button"
                      >
                        {entry.emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : semanticLoading ? (
            <div className={styles.noResults}>
              <span className={styles.noResultsEmoji}>✨</span>
              <p className={styles.noResultsText}>thinking…</p>
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
                    className={`${styles.cell} ${flash === entry.emoji ? styles.pop : ""}`}
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
