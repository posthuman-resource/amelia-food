'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useChat } from '@ai-sdk/react';
import Conversation from './Conversation';
import EmojiComposer from './EmojiComposer';
import EmojiPicker from './EmojiPicker';
import styles from './EmojiGame.module.css';

export default function EmojiGame() {
  const { messages, append, setMessages, isLoading } = useChat();
  const [selectedEmoji, setSelectedEmoji] = useState<string[]>([]);
  const hasSentOpener = useRef(false);

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

  const handleExplain = useCallback(() => {
    append({
      role: 'user',
      content: 'What just happened? Please explain our emoji conversation so far.',
    });
  }, [append]);

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
          disabled={isLoading || messages.length < 2}
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
    </div>
  );
}
