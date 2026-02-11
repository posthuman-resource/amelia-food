'use client';

import { useRef, useEffect } from 'react';
import type { UIMessage } from 'ai';
import styles from './Conversation.module.css';

interface ConversationProps {
  messages: UIMessage[];
}

export default function Conversation({ messages }: ConversationProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    container.scrollTo({
      top: container.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className={styles.conversation} ref={scrollRef}>
        <div className={styles.empty}>
          <span className={styles.emptyEmoji}>💬</span>
          <p className={styles.emptyText}>Send an emoji to start a conversation</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.conversation} ref={scrollRef}>
      {messages.map((message) => (
        <div
          key={message.id}
          className={`${styles.message} ${
            message.role === 'user' ? styles.user : styles.assistant
          }`}
        >
          <div className={styles.tile}>
            {message.parts.map((part, i) => {
              if (part.type === 'text') {
                return <span key={i}>{part.text}</span>;
              }
              return null;
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
