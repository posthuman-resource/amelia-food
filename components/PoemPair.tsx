"use client";

import { useState } from "react";
import type { PoemPair } from "@/lib/poems";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import styles from "./PoemPair.module.css";

function parseStanzas(text: string): string[][] {
  return text.split("\n\n").map((stanza) => stanza.split("\n"));
}

export function PoemPairCard({ pair }: { pair: PoemPair }) {
  return (
    <div className={styles.card}>
      <span className={styles.icon}>{pair.emoji}</span>
    </div>
  );
}

function PoemColumn({
  label,
  text,
  columnWidth,
}: {
  label: string;
  text: string;
  columnWidth: number;
}) {
  const stanzas = parseStanzas(text);
  const longestLine = Math.max(...text.split("\n").map((l) => l.length));
  const widthFactor = longestLine * 0.62;

  const style = {
    "--pair-font-size": `clamp(0.85rem, calc(${columnWidth}px / ${widthFactor}), 1.1rem)`,
  } as React.CSSProperties;

  return (
    <div className={styles.column}>
      <h3 className={styles.columnLabel}>{label}</h3>
      <div className={styles.columnScroll} style={style}>
        {stanzas.map((lines, i) => (
          <div key={i} className={styles.stanza}>
            {lines.map((line, j) => (
              <p key={j} className={styles.line}>
                {line}
              </p>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function TabPoem({ text }: { text: string }) {
  const stanzas = parseStanzas(text);
  const lineCount = text.split("\n").length;
  const stanzaCount = stanzas.length;
  const heightFactor = lineCount * 1.8 + (stanzaCount - 1) * 1.2;
  const longestLine = Math.max(...text.split("\n").map((l) => l.length));
  const widthFactor = longestLine * 0.62;

  const style = {
    "--pair-font-size": `clamp(1rem, min(calc((100dvh - 14rem) / ${heightFactor}), calc((100vw - 6rem) / ${widthFactor})), 1.25rem)`,
  } as React.CSSProperties;

  return (
    <div className={styles.tabPoem} style={style}>
      {stanzas.map((lines, i) => (
        <div key={i} className={styles.stanza}>
          {lines.map((line, j) => (
            <p key={j} className={styles.line}>
              {line}
            </p>
          ))}
        </div>
      ))}
    </div>
  );
}

export function PoemPairContent({ pair }: { pair: PoemPair }) {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [activeTab, setActiveTab] = useState(0);

  if (isMobile) {
    return (
      <div className={styles.content}>
        <div className={styles.tabs}>
          {pair.labels.map((label, i) => (
            <button
              key={i}
              className={`${styles.tab} ${i === activeTab ? styles.tabActive : ""}`}
              onClick={() => setActiveTab(i)}
            >
              {label}
            </button>
          ))}
        </div>
        <div className={`${styles.tabPanel} texture-paper`}>
          <div key={activeTab} className={styles.tabFade}>
            <TabPoem text={pair.texts[activeTab]} />
          </div>
        </div>
      </div>
    );
  }

  // Desktop: side-by-side
  return (
    <div className={styles.content}>
      <div className={`${styles.sideBySide} texture-paper`}>
        <PoemColumn
          label={pair.labels[0]}
          text={pair.texts[0]}
          columnWidth={400}
        />
        <div className={styles.divider} />
        <PoemColumn
          label={pair.labels[1]}
          text={pair.texts[1]}
          columnWidth={400}
        />
      </div>
    </div>
  );
}
