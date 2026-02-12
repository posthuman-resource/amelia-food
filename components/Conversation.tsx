'use client';

import { useRef, useEffect } from 'react';
import type { UIMessage } from '@ai-sdk/react';
import styles from './Conversation.module.css';

interface ConversationProps {
  messages: UIMessage[];
  isLoading?: boolean;
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

  const getText = (m: UIMessage) =>
    m.parts
      ?.filter((p): p is { type: 'text'; text: string } => p.type === 'text')
      .map((p) => p.text)
      .join('') ?? '';

  // Filter out the initial system-trigger message from the user
  const visibleMessages = messages.filter((m) => {
    if (m.role === 'user' && getText(m).includes('Start a new emoji conversation')) {
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
      {visibleMessages.map((message) => (
        <div
          key={message.id}
          className={`${styles.message} ${
            message.role === 'user' ? styles.user : styles.assistant
          }`}
        >
          <div className={styles.tile}>
            {getText(message)}
          </div>
        </div>
      ))}

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
