import styles from './Valentine.module.css';

export function ValentineEnvelope() {
  return (
    <div className={styles.envelope}>
      <div className={styles.envelopeBody}>
        <div className={styles.envelopeFlap} />
        <div className={styles.envelopeFold} />
        <div className={styles.seal} />
      </div>
      <p className={styles.envelopeLabel}>a letter</p>
    </div>
  );
}

export function ValentineLetter() {
  return (
    <div className={styles.letter}>
      <div className={`${styles.letterPaper} texture-paper`}>
        <p className={styles.greeting}>Amelia,</p>
        <div className={styles.body}>
          <p>
            I made this little corner of the internet just for you.
          </p>
          <p>
            There are things here to find — some now, some later.
            A few surprises tucked away for whenever you feel
            like looking.
          </p>
          <p>
            No rush. It&apos;ll be here.
          </p>
        </div>
        <p className={styles.signature}>— Mike</p>
      </div>
    </div>
  );
}
