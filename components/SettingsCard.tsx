"use client";

import { useState, useEffect, useCallback } from "react";
import styles from "./SettingsCard.module.css";

type NekoVariant = "classic" | "dog" | "tora" | "maia";

const VARIANTS: { id: NekoVariant; label: string }[] = [
  { id: "classic", label: "Neko" },
  { id: "dog", label: "Dog" },
  { id: "tora", label: "Tora" },
  { id: "maia", label: "Maia" },
];

function parseLocalStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function persistAndNotify(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
  // Defer event dispatch to avoid triggering setState in other components during render
  setTimeout(() => window.dispatchEvent(new Event("neko-settings-changed")), 0);
}

// --- Face (table surface) ---

export function SettingsCardFace() {
  const [variant, setVariant] = useState<NekoVariant>("classic");
  const [kuro, setKuro] = useState(false);

  useEffect(() => {
    function sync() {
      setVariant(parseLocalStorage<NekoVariant>("neko-variant", "classic"));
      setKuro(parseLocalStorage<boolean>("neko-kuro", false));
    }
    sync();
    window.addEventListener("neko-settings-changed", sync);
    return () => window.removeEventListener("neko-settings-changed", sync);
  }, []);

  return (
    <div className={styles.face}>
      <div
        className={styles.sprite}
        style={{
          backgroundImage: `url(/oneko/oneko-${variant}.gif)`,
          filter: kuro ? "invert(100%)" : undefined,
        }}
      />
    </div>
  );
}

// --- Content (modal) ---

export function SettingsCardContent() {
  const [variant, setVariant] = useState<NekoVariant>("classic");
  const [kuro, setKuro] = useState(false);
  const [forceSleep, setForceSleep] = useState(false);

  useEffect(() => {
    function sync() {
      setVariant(parseLocalStorage<NekoVariant>("neko-variant", "classic"));
      setKuro(parseLocalStorage<boolean>("neko-kuro", false));
      setForceSleep(parseLocalStorage<boolean>("neko-force-sleep", false));
    }
    sync();
    window.addEventListener("neko-settings-changed", sync);
    return () => window.removeEventListener("neko-settings-changed", sync);
  }, []);

  const changeVariant = useCallback((v: NekoVariant) => {
    setVariant(v);
    persistAndNotify("neko-variant", v);
  }, []);

  const toggleKuro = useCallback(() => {
    const next = !parseLocalStorage<boolean>("neko-kuro", false);
    setKuro(next);
    if (next) {
      document.documentElement.dataset.theme = "dark";
    } else {
      delete document.documentElement.dataset.theme;
    }
    persistAndNotify("neko-kuro", next);
  }, []);

  const toggleSleep = useCallback(() => {
    const next = !parseLocalStorage<boolean>("neko-force-sleep", false);
    setForceSleep(next);
    persistAndNotify("neko-force-sleep", next);
  }, []);

  return (
    <div className={styles.content}>
      <div className={`${styles.paper} texture-paper`}>
        <h2 className={styles.title}>flavor</h2>

        <div className={styles.toggles}>
          <button
            className={`${styles.toggle}${kuro ? ` ${styles.toggleOn}` : ""}`}
            onClick={toggleKuro}
          >
            dark mode
          </button>
          <button
            className={`${styles.toggle}${forceSleep ? ` ${styles.toggleOn}` : ""}`}
            onClick={toggleSleep}
          >
            sleepy
          </button>
        </div>

        <div className={styles.section}>
          <p className={styles.sectionLabel}>choose ur aminal</p>
          <div className={styles.variants}>
            {VARIANTS.map((v) => (
              <button
                key={v.id}
                className={`${styles.variantBtn}${variant === v.id ? ` ${styles.selected}` : ""}`}
                onClick={() => changeVariant(v.id)}
                aria-label={`Select ${v.label}`}
              >
                <div
                  className={styles.variantSprite}
                  style={{
                    backgroundImage: `url(/oneko/oneko-${v.id}.gif)`,
                    filter: kuro ? "invert(100%)" : undefined,
                  }}
                />
                <span className={styles.variantName}>{v.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
