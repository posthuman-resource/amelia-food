'use client';

import { useRef, useEffect } from 'react';
import type { Message } from 'ai';
import styles from './Conversation.module.css';

interface ConversationProps {
  messages: Message[];
  isLoading?: boolean;
}

/** Check if text is primarily emoji (not an explanation in prose) */
function isEmojiOnly(text: string): boolean {
  const stripped = text.replace(/\s/g, '');
  if (stripped.length === 0) return false;
  const emojiPattern =
    /^[\p{Emoji_Presentation}\p{Extended_Pictographic}\u200d\ufe0f\u20e3\u{1f3fb}-\u{1f3ff}]+$/u;
  return emojiPattern.test(stripped);
}

export default function Conversation({ messages, isLoading }: ConversationProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    container.scrollTo({
      top: container.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages, isLoading]);

  // Filter out the initial system-trigger message from the user
  const visibleMessages = messages.filter((m) => {
    if (m.role === 'user' && m.content.includes('Start a new emoji conversation')) {
      return false;
    }
    return true;
  });

  if (visibleMessages.length === 0 && !isLoading) {
    return (
      <div className={styles.conversation} ref={scrollRef}>
        <div className={styles.empty}>
          <span className={styles.emptyEmoji}>✨</span>
          <p className={styles.emptyText}>Claude is thinking of something…</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.conversation} ref={scrollRef}>
      {visibleMessages.map((message) => {
        const text = message.content;
        const isExplain = message.role === 'assistant' && !isEmojiOnly(text);

        return (
          <div
            key={message.id}
            className={`${styles.message} ${
              message.role === 'user' ? styles.user : styles.assistant
            }`}
          >
            <div className={`${styles.tile} ${isExplain ? styles.explain : ''}`}>
              {text}
            </div>
          </div>
        );
      })}

      {isLoading && (
        <div className={`${styles.message} ${styles.assistant}`}>
          <div className={`${styles.tile} ${styles.thinking}`}>
            <span className={styles.dot} />
            <span className={styles.dot} />
            <span className={styles.dot} />
          </div>
        </div>
      )}
    </div>
  );
}
