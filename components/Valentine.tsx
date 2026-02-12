import styles from './Valentine.module.css';

export function ValentineCard() {
  return (
    <div className={styles.card}>
      <div className={styles.cardHeart}>&#x2764;&#xFE0F;</div>
      <p className={styles.label}>valentine</p>
    </div>
  );
}

export function ValentineCardContent() {
  return (
    <div className={styles.letter}>
      <div className={`${styles.letterPaper} ${styles.valentinePaper} texture-paper`}>
        <p className={styles.valentineHeart}>&#x2764;&#xFE0F;</p>
        <div className={styles.body}>
          <p className={styles.valentineText}>
            I&apos;m here.
          </p>
          <p className={styles.valentineText}>
            I&apos;m not going anywhere.
          </p>
          <p className={styles.valentineText}>
            I would like to find out if we can be small and hungry and alive together.
          </p>
        </div>
        <p className={styles.signature}>~mike</p>
      </div>
    </div>
  );
}
