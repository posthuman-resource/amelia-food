"use client";

import { useState, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import type { WordDefinition } from "@/data/words";
import styles from "./WordCreator.module.css";
import { useMounted } from "../hooks/useMounted";
import { useScrollLock } from "../hooks/useScrollLock";
import { useEscapeKey } from "../hooks/useEscapeKey";
import { useCloseAnimation } from "../hooks/useCloseAnimation";

type Step = "describe" | "pick" | "saving";

interface WordCreatorProps {
  onComplete: (word: WordDefinition) => void;
  onClose: () => void;
}

export default function WordCreator({ onComplete, onClose }: WordCreatorProps) {
  const mounted = useMounted();
  const [step, setStep] = useState<Step>("describe");
  const [feeling, setFeeling] = useState("");
  const [words, setWords] = useState<WordDefinition[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const excludeRef = useRef<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { closing, handleClose } = useCloseAnimation(onClose);

  useScrollLock(true);
  useEscapeKey(handleClose);

  const generate = useCallback(async (text: string) => {
    setLoading(true);
    setError(null);
    setStep("pick");

    try {
      const res = await fetch("/api/words/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          feeling: text,
          excludeWords:
            excludeRef.current.length > 0 ? excludeRef.current : undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Something went wrong.");
      }

      const data = await res.json();
      setWords(data.words);
      // Track excluded words for "show me more"
      excludeRef.current = [
        ...excludeRef.current,
        ...data.words.map((w: WordDefinition) => w.word),
      ];
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSubmit = useCallback(() => {
    if (feeling.trim().length < 20) return;
    generate(feeling.trim());
  }, [feeling, generate]);

  const handleShowMore = useCallback(() => {
    generate(feeling.trim());
  }, [feeling, generate]);

  const handleGoBack = useCallback(() => {
    setStep("describe");
    setWords([]);
    setError(null);
    // Focus the textarea after transition
    setTimeout(() => textareaRef.current?.focus(), 50);
  }, []);

  const handlePick = useCallback(
    async (word: WordDefinition) => {
      setStep("saving");
      try {
        await fetch("/api/words", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(word),
        });
        onComplete(word);
      } catch {
        // Even if save fails, proceed — the word exists client-side
        onComplete(word);
      }
    },
    [onComplete],
  );

  if (!mounted) return null;

  return createPortal(
    <div
      className={`${styles.overlay} ${closing ? styles.overlayClosing : ""}`}
      role="dialog"
      aria-modal="true"
      aria-label="Describe a feeling"
    >
      <div className={styles.backdrop} onClick={handleClose} />

      <button
        className={styles.close}
        onClick={handleClose}
        aria-label="Close"
        type="button"
        data-neko-block="true"
      >
        &times;
      </button>

      {step === "describe" && (
        <div className={styles.step} data-neko-block="true">
          <div className={`${styles.card} texture-paper`}>
            <h2 className={styles.heading}>what does it feel like?</h2>
            <p className={styles.subtext}>
              describe a feeling you don&apos;t have a word for
            </p>
            <textarea
              ref={textareaRef}
              className={styles.textarea}
              value={feeling}
              onChange={(e) => setFeeling(e.target.value)}
              placeholder="that thing where you..."
              autoFocus
              onKeyDown={(e) => {
                if (
                  e.key === "Enter" &&
                  e.metaKey &&
                  feeling.trim().length >= 20
                ) {
                  handleSubmit();
                }
              }}
            />
            <div className={styles.submitRow}>
              <button
                className={styles.submitButton}
                onClick={handleSubmit}
                disabled={feeling.trim().length < 20}
                type="button"
              >
                find a word
              </button>
            </div>
          </div>
        </div>
      )}

      {step === "pick" && (
        <div
          className={`${styles.step} ${styles.pickStep}`}
          data-neko-block="true"
        >
          {loading && (
            <div className={styles.loading}>
              <p className={styles.loadingText}>thinking...</p>
            </div>
          )}

          {error && !loading && (
            <div className={styles.error}>
              <p className={styles.errorText}>{error}</p>
              <button
                className={styles.retryButton}
                onClick={() => generate(feeling.trim())}
                type="button"
              >
                try again
              </button>
            </div>
          )}

          {!loading && !error && words.length > 0 && (
            <>
              <div className={styles.wordOptions}>
                {words.map((word) => (
                  <button
                    key={word.id}
                    className={`${styles.wordOption} texture-paper`}
                    onClick={() => handlePick(word)}
                    type="button"
                  >
                    <p className={styles.optionWord}>{word.word}</p>
                    <p className={styles.optionPronunciation}>
                      {word.pronunciation}
                    </p>
                    <p className={styles.optionPos}>{word.partOfSpeech}</p>
                    <p className={styles.optionDescription}>
                      {word.description}
                    </p>
                    <div className={styles.optionParts}>
                      {word.parts.map((part) => (
                        <span key={part.german} className={styles.optionPart}>
                          <span className={styles.partGerman}>
                            {part.german}
                          </span>
                          <span className={styles.partEnglish}>
                            {part.english}
                          </span>
                        </span>
                      ))}
                    </div>
                    <p className={styles.optionLiteral}>
                      &ldquo;{word.literal}&rdquo;
                    </p>
                  </button>
                ))}
              </div>
              <div className={styles.pickActions}>
                <button
                  className={styles.backButton}
                  onClick={handleGoBack}
                  type="button"
                >
                  go back
                </button>
                <button
                  className={styles.moreButton}
                  onClick={handleShowMore}
                  type="button"
                >
                  show me more
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {step === "saving" && (
        <div className={styles.step} data-neko-block="true">
          <div className={styles.loading}>
            <p className={styles.loadingText}>saving...</p>
          </div>
        </div>
      )}
    </div>,
    document.body,
  );
}
