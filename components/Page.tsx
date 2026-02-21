"use client";

import type { Page } from "@/data/pages";
import { Streamdown } from "streamdown";
import styles from "./Page.module.css";

export function PageCard({ page }: { page: Page }) {
  return (
    <div className={styles.card}>
      <span className={styles.icon}>{page.emoji}</span>
    </div>
  );
}

export function PageContent({ page }: { page: Page }) {
  return (
    <div className={styles.content}>
      <div className={`${styles.paper} texture-paper`}>
        <Streamdown mode="static" className={styles.markdown}>
          {page.text}
        </Streamdown>
      </div>
    </div>
  );
}
