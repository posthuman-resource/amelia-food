import type { Poem } from "@/data/poems";
import styles from "./Poem.module.css";

function parseStanzas(text: string): string[][] {
  return text.split("\n\n").map((stanza) => stanza.split("\n"));
}

export function PoemCard({ poem }: { poem: Poem }) {
  return (
    <div className={styles.card}>
      <span className={styles.icon}>{poem.emoji}</span>
    </div>
  );
}

export function PoemContent({ poem }: { poem: Poem }) {
  const stanzas = parseStanzas(poem.text);
  const lineCount = poem.text.split("\n").length;
  const stanzaCount = stanzas.length;

  // Height factor: lines * line-height + stanza gaps (proportional to font)
  // Add extra space for the author line when present
  const authorExtra = poem.author ? 3 : 0;
  const heightFactor = lineCount * 1.8 + (stanzaCount - 1) * 1.2 + authorExtra;

  // Width factor: longest line in chars * ~0.62 (monospace ch-to-em ratio).
  // Available width: modal(560px) - scroll padding(6rem) - paper padding(4rem) = ~11rem overhead.
  // Mobile: full-width - scroll padding(3rem) - paper padding(3rem) = ~6rem overhead.
  const longestLine = Math.max(...poem.text.split("\n").map((l) => l.length));
  const widthFactor = longestLine * 0.62;

  // Font size = min(height-based, width-based), clamped to reasonable bounds.
  const paperStyle = {
    "--poem-font-size": `clamp(1.2rem, min(calc((100vh - 18rem) / ${heightFactor}), calc((min(660px, 100vw) - 11rem) / ${widthFactor})), 1.5rem)`,
    "--poem-font-size-mobile": `clamp(1rem, min(calc((100dvh - 12rem) / ${heightFactor}), calc((100vw - 6rem) / ${widthFactor})), 1.25rem)`,
  } as React.CSSProperties;

  return (
    <div className={styles.content}>
      <div className={`${styles.paper} texture-paper`} style={paperStyle}>
        {stanzas.map((lines, i) => (
          <div key={i} className={styles.stanza}>
            {lines.map((line, j) => (
              <p key={j} className={styles.line}>
                {line}
              </p>
            ))}
          </div>
        ))}
        {poem.author && <p className={styles.author}>&mdash; {poem.author}</p>}
      </div>
    </div>
  );
}
