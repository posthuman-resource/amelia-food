'use client';

import { useState } from 'react';
import styles from './Table.module.css';
import TableObject from './TableObject';
import Modal from './Modal';
import EmojiGame from './EmojiGame';
import { ValentineEnvelope, ValentineLetter } from './Valentine';

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

function ModalContent({ id }: { id: string }) {
  if (id === 'emoji-game') {
    return <EmojiGame />;
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
        {objects.map((obj, index) => (
          <TableObject
            key={obj.id}
            id={obj.id}
            x={obj.x}
            y={obj.y}
            rotation={obj.rotation}
            index={index}
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
