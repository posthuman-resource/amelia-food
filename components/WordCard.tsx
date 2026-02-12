'use client';

import { useState, useRef, useCallback } from 'react';
import type { WordDefinition } from '@/data/words';
import styles from './WordCard.module.css';

export function WordCardFace({ word }: { word: WordDefinition }) {
  return (
    <div className={styles.face}>
      <p className={styles.faceWord}>{word.word}</p>
      <p className={styles.faceLabel}>({word.partOfSpeech})</p>
    </div>
  );
}

export function CreateWordCardFace() {
  return (
    <div className={styles.createFace}>
      <span className={styles.createPlus}>+</span>
      <p className={styles.createLabel}>describe a feeling</p>
    </div>
  );
}

function playBase64Audio(
  base64: string,
  audioRef: React.RefObject<HTMLAudioElement | null>,
) {
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  const blob = new Blob([bytes], { type: 'audio/mp3' });
  const url = URL.createObjectURL(blob);

  if (audioRef.current) {
    audioRef.current.pause();
    URL.revokeObjectURL(audioRef.current.src);
  }

  const audio = new Audio(url);
  audioRef.current = audio;
  audio.addEventListener('ended', () => URL.revokeObjectURL(url));
  return audio.play();
}

export function WordCardContent({ word }: { word: WordDefinition }) {
  const [sentence, setSentence] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pronouncing, setPronouncing] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handlePronounce = useCallback(async () => {
    if (pronouncing) return;
    setPronouncing(true);

    try {
      const res = await fetch('/api/word-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word: word.word, pronounceOnly: true }),
      });

      if (!res.ok) throw new Error('Failed to generate audio');

      const data = await res.json();
      await playBase64Audio(data.audio, audioRef);
    } catch {
      // silent fail for pronunciation
    } finally {
      setPronouncing(false);
    }
  }, [word, pronouncing]);

  const handlePlay = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    setSentence(null);

    try {
      const res = await fetch('/api/word-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          word: word.word,
          definition: word.description,
          literal: word.literal,
        }),
      });

      if (!res.ok) throw new Error('Failed to generate audio');

      const data = await res.json();
      setSentence(data.sentence);
      await playBase64Audio(data.audio, audioRef);
    } catch {
      setSentence('Something went quiet. Try again?');
    } finally {
      setLoading(false);
    }
  }, [word, loading]);

  return (
    <div className={styles.content}>
      <div className={`${styles.paper} texture-paper`}>
        <h2 className={styles.word}>{word.word}</h2>
        <div className={styles.pronunciationRow}>
          <p className={styles.pronunciation}>{word.pronunciation}</p>
          <button
            className={`${styles.speakerButton} ${pronouncing ? styles.speakerButtonLoading : ''}`}
            onClick={handlePronounce}
            disabled={pronouncing}
            type="button"
            aria-label={`Pronounce ${word.word}`}
          >
            <svg
              className={styles.speakerIcon}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" stroke="none" />
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
            </svg>
          </button>
        </div>
        <p className={styles.pos}>({word.partOfSpeech})</p>

        <p className={styles.definition}>{word.description}</p>

        <div className={styles.parts}>
          {word.parts.map((part) => (
            <span key={part.german} className={styles.part}>
              <span className={styles.partGerman}>{part.german}</span>
              <span className={styles.partEnglish}>{part.english}</span>
            </span>
          ))}
        </div>

        <p className={styles.literal}>&ldquo;{word.literal}&rdquo;</p>

        <div className={styles.audioSection}>
          <button
            className={`${styles.playButton} ${loading ? styles.playButtonLoading : ''}`}
            onClick={handlePlay}
            disabled={loading}
            type="button"
            aria-label="Use this word naturally"
          >
            <svg
              className={styles.playIcon}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {loading ? (
                <>
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </>
              ) : (
                <>
                  <polygon points="6 3 20 12 6 21 6 3" fill="currentColor" stroke="none" />
                </>
              )}
            </svg>
            <span className={styles.playLabel}>use naturally</span>
          </button>

          {sentence && (
            <p className={styles.sentence}>{sentence}</p>
          )}
        </div>
      </div>
    </div>
  );
}
