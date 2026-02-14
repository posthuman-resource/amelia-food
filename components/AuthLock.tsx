"use client";

import { useState, useRef, useEffect } from "react";
import styles from "./AuthLock.module.css";

interface AuthLockProps {
  onUnlock: () => void;
}

export default function AuthLock({ onUnlock }: AuthLockProps) {
  const [value, setValue] = useState("");
  const [label, setLabel] = useState("locked");
  const [shaking, setShaking] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (value.toLowerCase().trim() === "bananamoon") {
      setUnlocking(true);
      sessionStorage.setItem("amelia-unlocked", "true");
      setTimeout(onUnlock, 500);
    } else {
      setShaking(true);
      setLabel("hmm");
      setValue("");
      setTimeout(() => {
        setShaking(false);
        setLabel("locked");
      }, 800);
    }
  }

  const lockClass = [
    styles.lock,
    shaking ? styles.shake : "",
    unlocking ? styles.unlocking : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={lockClass}>
      <form
        onSubmit={handleSubmit}
        className={`${styles.lockCard} texture-paper`}
      >
        <span className={styles.emoji}>{unlocking ? "🔓" : "🔒"}</span>
        <p className={styles.label}>{label}</p>
        <input
          ref={inputRef}
          type="password"
          className={styles.input}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="..."
          autoComplete="off"
          spellCheck={false}
          disabled={unlocking}
        />
      </form>
    </div>
  );
}
