"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import styles from "./VennDiagram.module.css";
import { layoutWords, computeCircles, type PlacedWord } from "@/lib/vennLayout";
import type { VennEntry, VennSection } from "@/lib/venn";

interface VennDiagramProps {
  entries: VennEntry[];
}

export default function VennDiagram({
  entries: initialEntries,
}: VennDiagramProps) {
  const [entries, setEntries] = useState<VennEntry[]>(initialEntries);
  const [activeInput, setActiveInput] = useState<VennSection | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [layout, setLayout] = useState<PlacedWord[]>([]);
  const [hiddenEntries, setHiddenEntries] = useState<VennEntry[]>([]);
  const [showHidden, setShowHidden] = useState(false);

  const diagramRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // SVG circle geometry — compute from a reference size and scale via viewBox
  const svgWidth = 600;
  const svgHeight = 460;
  const circles = useMemo(() => computeCircles(svgWidth, svgHeight), []);

  // Sync if props change (e.g. from server re-fetch)
  useEffect(() => {
    setEntries(initialEntries);
  }, [initialEntries]);

  // Run layout in the fixed SVG coordinate space
  const runLayout = useCallback(() => {
    const { placed, hidden } = layoutWords(entries, svgWidth, svgHeight);
    setLayout(placed);
    setHiddenEntries(hidden);
  }, [entries]);

  useEffect(() => {
    runLayout();
  }, [runLayout]);

  // No need for resize observer — layout is in fixed SVG coordinate space
  // and words are positioned via percentages

  // Focus input when it appears
  useEffect(() => {
    if (activeInput) inputRef.current?.focus();
  }, [activeInput]);

  // Dismiss selected word on click outside
  useEffect(() => {
    if (!selectedWord) return;
    function handleClick() {
      setSelectedWord(null);
    }
    // Delay to avoid immediately dismissing
    const id = setTimeout(() => {
      document.addEventListener("click", handleClick, { once: true });
    }, 0);
    return () => {
      clearTimeout(id);
      document.removeEventListener("click", handleClick);
    };
  }, [selectedWord]);

  const handleAdd = useCallback(async (section: VennSection, text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    setInputValue("");
    setActiveInput(null);

    // Optimistic add with temp ID
    const tempId = `temp-${Date.now()}`;
    const optimistic: VennEntry = {
      id: tempId,
      text: trimmed,
      section,
      createdAt: new Date().toISOString(),
    };
    setEntries((prev) => [...prev, optimistic]);

    const res = await fetch("/api/venn", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: trimmed, section }),
    });
    const saved: VennEntry = await res.json();

    // Replace temp with real entry
    setEntries((prev) => prev.map((e) => (e.id === tempId ? saved : e)));
  }, []);

  const handleRemove = useCallback(async (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
    setSelectedWord(null);
    await fetch(`/api/venn/${id}`, { method: "DELETE" });
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, section: VennSection) => {
      if (e.key === "Enter") {
        handleAdd(section, inputValue);
      } else if (e.key === "Escape") {
        setActiveInput(null);
        setInputValue("");
      }
    },
    [handleAdd, inputValue],
  );

  const toggleInput = useCallback(
    (section: VennSection) => {
      if (activeInput === section) {
        setActiveInput(null);
        setInputValue("");
      } else {
        setActiveInput(section);
        setInputValue("");
      }
    },
    [activeInput],
  );

  return (
    <div className={styles.container}>
      {/* Add buttons */}
      <div className={styles.controls}>
        {(["left", "both", "right"] as VennSection[]).map((section) => {
          const label =
            section === "left"
              ? "+ Mike"
              : section === "right"
                ? "+ Amy"
                : "+ Both";
          return (
            <div key={section} className={styles.controlGroup}>
              <button
                className={`${styles.addButton} ${activeInput === section ? styles.addButtonActive : ""}`}
                onClick={() => toggleInput(section)}
                type="button"
              >
                {label}
              </button>
              {activeInput === section && (
                <div className={styles.inputRow}>
                  <input
                    ref={inputRef}
                    className={styles.input}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, section)}
                    placeholder="type & enter"
                    maxLength={60}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Diagram */}
      <div className={styles.diagramArea} ref={diagramRef}>
        {/* SVG circles */}
        <svg
          className={styles.svgLayer}
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          preserveAspectRatio="xMidYMid meet"
        >
          <circle
            cx={circles.cx1}
            cy={circles.cy}
            r={circles.r}
            fill="rgba(107, 45, 91, 0.06)"
            stroke="rgba(107, 45, 91, 0.25)"
            strokeWidth="1.5"
          />
          <circle
            cx={circles.cx2}
            cy={circles.cy}
            r={circles.r}
            fill="rgba(45, 91, 75, 0.06)"
            stroke="rgba(45, 91, 75, 0.25)"
            strokeWidth="1.5"
          />
        </svg>

        {/* Word overlay */}
        <div className={styles.wordLayer}>
          {layout.map((word) => {
            // Position as percentage of the SVG coordinate space
            const leftPct = (word.x / svgWidth) * 100;
            const topPct = (word.y / svgHeight) * 100;
            // Font size as percentage of container width for responsive scaling
            const fsPct = (word.fontSize / svgWidth) * 100;

            const isSelected = selectedWord === word.id;

            return (
              <span
                key={word.id}
                className={`${styles.word} ${isSelected ? styles.wordSelected : ""}`}
                style={{
                  left: `${leftPct}%`,
                  top: `${topPct}%`,
                  fontSize: `${fsPct}cqw`,
                  color: word.color,
                  transform: `translate(-50%, -50%) rotate(${word.rotation}deg)`,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedWord(isSelected ? null : word.id);
                }}
              >
                {word.text}
                {isSelected && (
                  <button
                    className={styles.removeButton}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemove(word.id);
                    }}
                    type="button"
                    aria-label={`Remove ${word.text}`}
                  >
                    ×
                  </button>
                )}
              </span>
            );
          })}
        </div>

        {entries.length === 0 && (
          <div className={styles.emptyHint}>
            add what makes you
            <br />
            improbably alike
          </div>
        )}
      </div>

      {/* Labels */}
      <div className={styles.labels}>
        <span className={styles.label}>Mike</span>
        <span className={styles.label}>Amy</span>
      </div>

      {/* Hidden entries overflow */}
      {hiddenEntries.length > 0 && (
        <>
          <button
            className={styles.hiddenToggle}
            onClick={() => setShowHidden((v) => !v)}
            type="button"
          >
            {showHidden ? "hide" : `and ${hiddenEntries.length} more\u2026`}
          </button>
          {showHidden && (
            <div className={styles.hiddenList}>
              {(["left", "both", "right"] as VennSection[]).map((section) => {
                const sectionHidden = hiddenEntries.filter(
                  (e) => e.section === section,
                );
                if (sectionHidden.length === 0) return null;
                const label =
                  section === "left"
                    ? "Mike"
                    : section === "right"
                      ? "Amy"
                      : "Both";
                return (
                  <div key={section} className={styles.hiddenSection}>
                    <span className={styles.hiddenSectionLabel}>{label}</span>
                    <ul className={styles.hiddenItems}>
                      {sectionHidden.map((entry) => (
                        <li key={entry.id} className={styles.hiddenItem}>
                          <span>{entry.text}</span>
                          <button
                            className={styles.hiddenRemove}
                            onClick={() => handleRemove(entry.id)}
                            type="button"
                            aria-label={`Remove ${entry.text}`}
                          >
                            &times;
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
