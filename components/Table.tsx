'use client';

import { useState } from 'react';
import { useChat } from '@ai-sdk/react';
import styles from './Table.module.css';
import TableObject from './TableObject';
import Modal from './Modal';
import Conversation from './Conversation';
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
  const { messages, input, setInput, handleSubmit } = useChat();

  function handleEmojiSelect(emoji: string) {
    setInput((prev) => prev + emoji);
  }

  return (
    <div className={styles.emojiGameModal}>
      <h2 className={styles.modalTitle}>Emoji Game</h2>
      <Conversation messages={messages} />
      <form className={styles.emojiInput} onSubmit={handleSubmit}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Send an emoji..."
          className={styles.emojiField}
        />
        <button type="submit" className={styles.emojiSend} disabled={!input.trim()}>
          Send
        </button>
      </form>
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
