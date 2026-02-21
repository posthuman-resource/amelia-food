"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "./AuthLock.module.css";

export default function AuthLock() {
  const [value, setValue] = useState("");
  const [label, setLabel] = useState("locked");
  const [shaking, setShaking] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: value.toLowerCase().trim() }),
      });

      if (res.ok) {
        setUnlocking(true);
        setTimeout(() => router.refresh(), 500);
      } else {
        setShaking(true);
        setLabel("hmm");
        setValue("");
        setTimeout(() => {
          setShaking(false);
          setLabel("locked");
        }, 800);
      }
    } catch {
      setShaking(true);
      setLabel("hmm");
      setValue("");
      setTimeout(() => {
        setShaking(false);
        setLabel("locked");
      }, 800);
    } finally {
      if (!unlocking) setSubmitting(false);
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
        <input
          ref={inputRef}
          type="password"
          className={styles.input}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="..."
          autoComplete="off"
          spellCheck={false}
          disabled={unlocking || submitting}
        />
      </form>
      <p className={styles.label}>{label}</p>
    </div>
  );
}
