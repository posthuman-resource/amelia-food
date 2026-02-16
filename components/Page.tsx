import type { Page } from "@/data/pages";
import styles from "./Page.module.css";

type Section = {
  header: string;
  items: string[];
};

function parseInlineMarkdown(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex = /\*\*(.+?)\*\*|\*(.+?)\*/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    if (match[1]) {
      parts.push(<strong key={match.index}>{match[1]}</strong>);
    } else if (match[2]) {
      parts.push(<em key={match.index}>{match[2]}</em>);
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}

function parseSections(text: string): Section[] {
  const blocks = text.split("\n\n");
  const sections: Section[] = [];
  let current: Section | null = null;

  for (const block of blocks) {
    const trimmed = block.trim();
    if (!trimmed) continue;

    if (trimmed.startsWith("- ")) {
      // Book entry — belongs to current section
      if (current) {
        current.items.push(trimmed.slice(2));
      }
    } else {
      // Section header
      current = { header: trimmed, items: [] };
      sections.push(current);
    }
  }

  return sections;
}

export function PageCard({ page }: { page: Page }) {
  return (
    <div className={styles.card}>
      <span className={styles.icon}>{page.emoji}</span>
      <p className={styles.label}>{page.title}</p>
    </div>
  );
}

export function PageContent({ page }: { page: Page }) {
  const sections = parseSections(page.text);

  return (
    <div className={styles.content}>
      <div className={`${styles.paper} texture-paper`}>
        {sections.map((section, i) => (
          <div key={i} className={styles.section}>
            <h2 className={styles.sectionHeader}>{section.header}</h2>
            <ul className={styles.list}>
              {section.items.map((item, j) => (
                <li key={j} className={styles.item}>
                  {parseInlineMarkdown(item)}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
