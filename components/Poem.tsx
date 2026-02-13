import type { Poem } from "@/data/poems";
import styles from "./Poem.module.css";

function parseStanzas(text: string): string[][] {
  return text.split("\n\n").map((stanza) => stanza.split("\n"));
}

export function PoemCard({ poem }: { poem: Poem }) {
  return (
    <div className={styles.card}>
      <span className={styles.icon}>{poem.emoji}</span>
      <p className={styles.label}>{poem.title}</p>
    </div>
  );
}

export function PoemContent({ poem }: { poem: Poem }) {
  const stanzas = parseStanzas(poem.text);
  const lineCount = poem.text.split("\n").length;
  const stanzaCount = stanzas.length;

  // Height factor: lines * line-height + stanza gaps (proportional to font)
  const heightFactor = lineCount * 1.8 + (stanzaCount - 1) * 1.2;

  // Compute font size that tries to fit the poem without scrolling.
  // Available height = viewport - fixed padding overhead (modal + poem + paper).
  // fontSize = available / heightFactor, clamped to reasonable bounds.
  const paperStyle = {
    "--poem-font-size": `clamp(1rem, calc((100vh - 18rem) / ${heightFactor}), 1.5rem)`,
    "--poem-font-size-mobile": `clamp(0.875rem, calc((100dvh - 12rem) / ${heightFactor}), 1.25rem)`,
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
      </div>
    </div>
  );
}
