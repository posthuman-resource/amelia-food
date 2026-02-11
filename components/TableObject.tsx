import styles from './TableObject.module.css';

interface TableObjectProps {
  id: string;
  x: number;
  y: number;
  rotation: number;
}

export default function TableObject({ id, x, y, rotation }: TableObjectProps) {
  return (
    <div
      className={styles.object}
      data-object-id={id}
      style={{
        '--x': `${x}%`,
        '--y': `${y}%`,
        '--rotation': `${rotation}deg`,
      } as React.CSSProperties}
    >
      <div className={styles.placeholder}>
        {id}
      </div>
    </div>
  );
}
