'use client';

import styles from './TableObject.module.css';

interface TableObjectProps {
  id: string;
  x: number;
  y: number;
  rotation: number;
  index?: number;
  children: React.ReactNode;
  onClick?: () => void;
}

export default function TableObject({ id, x, y, rotation, index = 0, children, onClick }: TableObjectProps) {
  return (
    <div
      className={styles.object}
      data-object-id={id}
      style={{
        '--x': `${x}%`,
        '--y': `${y}%`,
        '--rotation': `${rotation}deg`,
        '--stagger': `${index * 100}ms`,
      } as React.CSSProperties}
    >
      <button
        className={`${styles.card} texture-paper`}
        onClick={onClick}
        type="button"
        aria-label={id}
      >
        {children}
      </button>
    </div>
  );
}
