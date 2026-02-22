"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import styles from "./SettingsCard.module.css";
import { NEKO_VARIANTS, DEFAULT_NAMES, type NekoVariant } from "@/lib/neko";

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
  const [customNames, setCustomNames] = useState<
    Partial<Record<NekoVariant, string>>
  >({});
  const savingRef = useRef<Record<string, AbortController>>({});

  // Fetch custom names from DB on mount
  useEffect(() => {
    fetch("/api/neko-names")
      .then((r) => (r.ok ? r.json() : {}))
      .then(setCustomNames)
      .catch(() => {});
  }, []);

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

  const saveName = useCallback((v: NekoVariant, name: string) => {
    // Cancel any in-flight save for this variant
    savingRef.current[v]?.abort();
    const controller = new AbortController();
    savingRef.current[v] = controller;

    const trimmed = name.trim();
    setCustomNames((prev) => {
      const next = { ...prev };
      if (!trimmed || trimmed === DEFAULT_NAMES[v]) {
        delete next[v];
      } else {
        next[v] = trimmed;
      }
      return next;
    });

    fetch("/api/neko-names", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ variant: v, name: trimmed }),
      signal: controller.signal,
    }).catch(() => {});
  }, []);

  return (
    <div className={styles.content}>
      <div className={`${styles.paper} texture-paper`}>
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
          <p className={styles.sectionLabel}>
            choose &amp; name your animal friends
          </p>
          <div className={styles.variants}>
            {NEKO_VARIANTS.map((id) => (
              <div
                key={id}
                role="button"
                tabIndex={0}
                className={`${styles.variantBtn}${variant === id ? ` ${styles.selected}` : ""}`}
                onClick={() => changeVariant(id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") changeVariant(id);
                }}
                aria-label={`Select ${customNames[id] || DEFAULT_NAMES[id]}`}
              >
                <div
                  className={styles.variantSprite}
                  style={{
                    backgroundImage: `url(/oneko/oneko-${id}.gif)`,
                  }}
                />
                <input
                  type="text"
                  className={styles.variantNameInput}
                  value={customNames[id] ?? ""}
                  placeholder={DEFAULT_NAMES[id]}
                  maxLength={30}
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => {
                    e.stopPropagation();
                    if (e.key === "Enter") e.currentTarget.blur();
                  }}
                  onChange={(e) => {
                    const val = e.target.value;
                    setCustomNames((prev) => ({ ...prev, [id]: val }));
                  }}
                  onBlur={(e) => saveName(id, e.target.value)}
                  aria-label={`Name for ${DEFAULT_NAMES[id]}`}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
