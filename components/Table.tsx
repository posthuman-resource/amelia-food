import styles from './Table.module.css';
import TableObject from './TableObject';

interface TableObjectData {
  id: string;
  x: number; // percentage from left (desktop)
  y: number; // percentage from top (desktop)
  rotation: number; // degrees
}

const objects: TableObjectData[] = [
  { id: 'emoji-game', x: 35, y: 30, rotation: -2 },
  { id: 'valentine', x: 60, y: 55, rotation: 3 },
];

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
          />
        ))}
      </div>
    </div>
  );
}
