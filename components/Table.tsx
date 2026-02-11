import styles from './Table.module.css';
import TableObject from './TableObject';

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
    return (
      <div className={styles.envelopeCard}>
        <div className={styles.envelopeFlap} />
        <div className={styles.envelopeSeal} />
        <p className={styles.cardLabel}>a letter</p>
      </div>
    );
  }
  return null;
}

export default function Table() {
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
          >
            <ObjectContent id={obj.id} />
          </TableObject>
        ))}
      </div>
    </div>
  );
}
