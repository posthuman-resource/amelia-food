'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useChat, type UIMessage } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { Streamdown } from 'streamdown';
import Conversation from './Conversation';
import EmojiComposer from './EmojiComposer';
import EmojiPicker from './EmojiPicker';
import Modal from './Modal';
import styles from './EmojiGame.module.css';

const STORAGE_KEY = 'emoji-game-messages';

const chatTransport = new DefaultChatTransport({ api: '/api/chat' });

function loadMessages(): UIMessage[] | undefined {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return undefined;
    const parsed = JSON.parse(stored);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  } catch { /* corrupted data, start fresh */ }
  return undefined;
}

function saveMessages(messages: UIMessage[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  } catch { /* storage full, silently fail */ }
}

export default function EmojiGame() {
  const { messages, sendMessage, setMessages, status } = useChat({
    transport: chatTransport,
  });
  const isLoading = status === 'streaming' || status === 'submitted';
  const [selectedEmoji, setSelectedEmoji] = useState<string[]>([]);
  const hasSentOpener = useRef(false);
  const hasRestored = useRef(false);

  // Explain modal state
  const [explainOpen, setExplainOpen] = useState(false);
  const [explainText, setExplainText] = useState('');
  const [explainLoading, setExplainLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // On mount, restore saved conversation or start a new one
  useEffect(() => {
    if (hasSentOpener.current) return;
    hasSentOpener.current = true;

    const saved = loadMessages();
    if (saved) {
      hasRestored.current = true;
      setMessages(saved);
    } else {
      sendMessage({
        text: 'Start a new emoji conversation. Send your opening emoji.',
      });
    }
  }, [sendMessage, setMessages]);

  // Persist messages to localStorage whenever they change
  useEffect(() => {
    // Don't save empty state (would wipe storage during initialization)
    if (messages.length === 0) return;
    saveMessages(messages);
  }, [messages]);

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
    sendMessage({ text: message });
    setSelectedEmoji([]);
  }, [selectedEmoji, sendMessage]);

  const handleExplain = useCallback(async () => {
    // Build a labeled transcript (skip system triggers)
    const getText = (m: UIMessage) =>
      m.parts
        ?.filter((p): p is { type: 'text'; text: string } => p.type === 'text')
        .map((p) => p.text)
        .join('') ?? '';
    const transcript = messages
      .filter((m) => !getText(m).includes('Start a new emoji conversation'))
      .map((m) => `${m.role === 'assistant' ? 'You (the bot)' : 'Amy'}: ${getText(m)}`)
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

        accumulated += decoder.decode(value, { stream: true });
        setExplainText(accumulated);
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
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
    hasRestored.current = false;
    hasSentOpener.current = false;
    // Re-trigger the opening message
    setTimeout(() => {
      hasSentOpener.current = true;
      sendMessage({
        text: 'Start a new emoji conversation. Send your opening emoji.',
      });
    }, 100);
  }, [setMessages, sendMessage]);

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
