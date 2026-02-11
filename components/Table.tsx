'use client';

import { useState, useCallback } from 'react';
import { useChat } from '@ai-sdk/react';
import styles from './Table.module.css';
import TableObject from './TableObject';
import Modal from './Modal';
import Conversation from './Conversation';
import EmojiComposer from './EmojiComposer';
import { ValentineEnvelope, ValentineLetter } from './Valentine';
import EmojiPicker from './EmojiPicker';

interface TableObjectData {
  id: string;
  x: number; // percentage from left (desktop)
  y: number; // percentage from top (desktop)
  rotation: number; // degrees
  label: string;
}

const objects: TableObjectData[] = [
  { id: 'emoji-game', x: 35, y: 30, rotation: -2, label: 'Emoji Game' },
  { id: 'valentine', x: 60, y: 55, rotation: 3, label: 'Valentine' },
];

function ObjectContent({ id }: { id: string }) {
  if (id === 'emoji-game') {
    return (
      <div className={styles.emojiCard}>
        <div className={styles.emojiTiles}>
          <span>🎲</span>
          <span>💬</span>
          <span>✨</span>
        </div>
        <p className={styles.cardLabel}>emoji game</p>
      </div>
    );
  }
  if (id === 'valentine') {
    return <ValentineEnvelope />;
  }
  return null;
}

function EmojiGameModal() {
  const { messages, setInput, handleSubmit } = useChat();
  const [selectedEmoji, setSelectedEmoji] = useState<string[]>([]);

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
    setInput(message);
    // Submit via a synthetic form event after setting input
    // Use requestAnimationFrame to let the state update flush
    requestAnimationFrame(() => {
      handleSubmit();
    });
    setSelectedEmoji([]);
  }, [selectedEmoji, setInput, handleSubmit]);

  return (
    <div className={styles.emojiGameModal}>
      <h2 className={styles.modalTitle}>Emoji Game</h2>
      <Conversation messages={messages} />
      <EmojiComposer
        selectedEmoji={selectedEmoji}
        onRemove={handleRemove}
        onSend={handleSend}
        onClear={handleClear}
      />
      <EmojiPicker onSelect={handleEmojiSelect} />
    </div>
  );
}

function ModalContent({ id }: { id: string }) {
  if (id === 'emoji-game') {
    return <EmojiGameModal />;
  }
  if (id === 'valentine') {
    return <ValentineLetter />;
  }
  return null;
}

export default function Table() {
  const [activeObject, setActiveObject] = useState<string | null>(null);
  const activeData = objects.find((o) => o.id === activeObject);

  return (
    <div className={`${styles.table} texture-wood texture-noise`}>
      {/* Subtle "Amelia" inscription */}
      <div className={styles.inscription}>Amelia</div>

      {/* Table objects */}
      <div className={styles.objectsContainer}>
        {objects.map((obj) => (
          <TableObject
            key={obj.id}
            id={obj.id}
            x={obj.x}
            y={obj.y}
            rotation={obj.rotation}
            onClick={() => setActiveObject(obj.id)}
          >
            <ObjectContent id={obj.id} />
          </TableObject>
        ))}
      </div>

      {/* Modal overlay */}
      <Modal
        open={activeObject !== null}
        onClose={() => setActiveObject(null)}
        ariaLabel={activeData?.label}
      >
        {activeObject && <ModalContent id={activeObject} />}
      </Modal>
    </div>
  );
}
