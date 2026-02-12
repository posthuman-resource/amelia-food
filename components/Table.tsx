'use client';

import { useState, useEffect } from 'react';
import styles from './Table.module.css';
import TableObject from './TableObject';
import Modal from './Modal';
import EmojiGame from './EmojiGame';
import { ValentineEnvelope, ValentineLetter, ValentineCard, ValentineCardContent } from './Valentine';
import AuthLock from './AuthLock';

interface TableObjectData {
  id: string;
  x: number; // percentage from left (desktop)
  y: number; // percentage from top (desktop)
  rotation: number; // degrees
  label: string;
}

const objects: TableObjectData[] = [
  { id: 'emoji-game', x: 35, y: 30, rotation: -2, label: 'Emoji Game' },
  { id: 'welcome', x: 60, y: 55, rotation: 3, label: 'Welcome' },
  { id: 'poem', x: 20, y: 65, rotation: -1.5, label: 'Dendrites' },
  { id: 'valentine', x: 72, y: 30, rotation: 2, label: 'Valentine' },
  { id: 'lock', x: 88, y: 85, rotation: 1, label: 'Lock' },
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
  if (id === 'welcome') {
    return <ValentineEnvelope />;
  }
  if (id === 'poem') {
    return (
      <div className={styles.poemCard}>
        <span className={styles.poemIcon}>📜</span>
        <p className={styles.cardLabel}>dendrites</p>
      </div>
    );
  }
  if (id === 'valentine') {
    return <ValentineCard />;
  }
  if (id === 'lock') {
    return (
      <div className={styles.lockCard}>
        <span className={styles.lockIcon}>🔒</span>
        <p className={styles.cardLabel}>lock</p>
      </div>
    );
  }
  return null;
}

function ModalContent({ id }: { id: string }) {
  if (id === 'emoji-game') {
    return <EmojiGame />;
  }
  if (id === 'welcome') {
    return <ValentineLetter />;
  }
  if (id === 'valentine') {
    return <ValentineCardContent />;
  }
  if (id === 'poem') {
    return (
      <div className={styles.poem}>
        <div className={`${styles.poemPaper} texture-paper`}>
          <div className={styles.stanza}>
            <p className={styles.poemLine}>two monsters walk</p>
            <p className={styles.poemLine}>into frog heaven</p>
            <p className={styles.poemLine}>this isn&apos;t a joke</p>
          </div>
          <div className={styles.stanza}>
            <p className={styles.poemLine}>goodnight, they lie</p>
            <p className={styles.poemLine}>soothed by frantic</p>
            <p className={styles.poemLine}>interrogation</p>
          </div>
          <div className={styles.stanza}>
            <p className={styles.poemLine}>says she&apos;d haunt him —</p>
            <p className={styles.poemLine}>he says yes</p>
            <p className={styles.poemLine}>before she can finish</p>
          </div>
        </div>
      </div>
    );
  }
  return null;
}

export default function Table() {
  const [activeObject, setActiveObject] = useState<string | null>(null);
  const [unlocked, setUnlocked] = useState(false);
  const [mounted, setMounted] = useState(false);
  const activeData = objects.find((o) => o.id === activeObject);

  useEffect(() => {
    if (sessionStorage.getItem('amelia-unlocked') === 'true') {
      setUnlocked(true);
    }
    setMounted(true);
  }, []);

  return (
    <div className={`${styles.table} texture-wood texture-noise`}>
      {mounted && !unlocked && (
        <AuthLock onUnlock={() => setUnlocked(true)} />
      )}

      {unlocked && (
        <>
          {/* Subtle "Amelia" inscription */}
          <div className={styles.inscription}>Amy</div>

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
                onClick={() => {
                  if (obj.id === 'lock') {
                    sessionStorage.removeItem('amelia-unlocked');
                    setUnlocked(false);
                  } else {
                    setActiveObject(obj.id);
                  }
                }}
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
        </>
      )}
    </div>
  );
}
