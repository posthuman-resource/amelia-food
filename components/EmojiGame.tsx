'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useChat } from '@ai-sdk/react';
import { Streamdown } from 'streamdown';
import Conversation from './Conversation';
import EmojiComposer from './EmojiComposer';
import EmojiPicker from './EmojiPicker';
import Modal from './Modal';
import styles from './EmojiGame.module.css';

export default function EmojiGame() {
  const { messages, append, setMessages, isLoading } = useChat();
  const [selectedEmoji, setSelectedEmoji] = useState<string[]>([]);
  const hasSentOpener = useRef(false);

  // Explain modal state
  const [explainOpen, setExplainOpen] = useState(false);
  const [explainText, setExplainText] = useState('');
  const [explainLoading, setExplainLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // On mount, send an initial message to get Claude's opening emoji
  useEffect(() => {
    if (hasSentOpener.current) return;
    hasSentOpener.current = true;
    append({
      role: 'user',
      content: 'Start a new emoji conversation. Send your opening emoji.',
    });
  }, [append]);

  const handleEmojiSelect = useCallback((emoji: string) => {
    setSelectedEmoji((prev) => [...prev, emoji]);
  }, []);

  const handleRemove = useCallback((index: number) => {
    setSelectedEmoji((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleClear = useCallback(() => {
    setSelectedEmoji([]);
  }, []);

  const handleSend = useCallback(() => {
    if (selectedEmoji.length === 0) return;
    const message = selectedEmoji.join('');
    append({ role: 'user', content: message });
    setSelectedEmoji([]);
  }, [selectedEmoji, append]);

  const handleExplain = useCallback(async () => {
    // Build a labeled transcript (skip system triggers)
    const transcript = messages
      .filter((m) => !m.content.includes('Start a new emoji conversation'))
      .map((m) => `${m.role === 'assistant' ? 'You (the bot)' : 'Amy'}: ${m.content}`)
      .join('\n');

    const explainMessages = [
      {
        role: 'user' as const,
        content: `Here's the emoji conversation:\n\n${transcript}\n\nWhat just happened?`,
      },
    ];

    setExplainOpen(true);
    setExplainText('');
    setExplainLoading(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch('/api/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: explainMessages }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        setExplainText('Something went wrong. Try again?');
        setExplainLoading(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        // Parse AI SDK data stream format: lines starting with 0:"text"
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('0:')) {
            try {
              const text = JSON.parse(line.slice(2));
              accumulated += text;
              setExplainText(accumulated);
            } catch {
              // Skip malformed lines
            }
          }
        }
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setExplainText('Something went wrong. Try again?');
      }
    } finally {
      setExplainLoading(false);
      abortRef.current = null;
    }
  }, [messages]);

  const handleExplainClose = useCallback(() => {
    // Abort any in-flight request
    abortRef.current?.abort();
    setExplainOpen(false);
    setExplainText('');
    setExplainLoading(false);
  }, []);

  const handleNewConversation = useCallback(() => {
    setMessages([]);
    setSelectedEmoji([]);
    hasSentOpener.current = false;
    // Re-trigger the opening message
    setTimeout(() => {
      hasSentOpener.current = true;
      append({
        role: 'user',
        content: 'Start a new emoji conversation. Send your opening emoji.',
      });
    }, 100);
  }, [setMessages, append]);

  return (
    <div className={styles.game}>
      <h2 className={styles.title}>Emoji Game</h2>

      <Conversation messages={messages} isLoading={isLoading} />

      <EmojiComposer
        selectedEmoji={selectedEmoji}
        onRemove={handleRemove}
        onSend={handleSend}
        onClear={handleClear}
      />

      <div className={styles.actionBar}>
        <button
          className={styles.explainBtn}
          onClick={handleExplain}
          disabled={isLoading || explainLoading || messages.length < 2}
          type="button"
          title="What just happened?"
        >
          <span className={styles.explainIcon}>?</span>
          <span className={styles.explainLabel}>what just happened?</span>
        </button>
        <button
          className={styles.newBtn}
          onClick={handleNewConversation}
          disabled={isLoading}
          type="button"
        >
          start over
        </button>
      </div>

      <div className={styles.pickerWrap}>
        <EmojiPicker onSelect={handleEmojiSelect} />
      </div>

      <Modal
        open={explainOpen}
        onClose={handleExplainClose}
        ariaLabel="Emoji conversation explanation"
      >
        <div className={styles.explainModal}>
          {explainLoading && !explainText && (
            <div className={styles.explainLoading}>
              <span className={styles.loadingDot} />
              <span className={styles.loadingDot} />
              <span className={styles.loadingDot} />
            </div>
          )}
          <Streamdown isAnimating={explainLoading}>
            {explainText}
          </Streamdown>
        </div>
      </Modal>
    </div>
  );
}
