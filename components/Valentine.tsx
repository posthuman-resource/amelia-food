import styles from './Valentine.module.css';

export function ValentineEnvelope() {
  return (
    <div className={styles.envelope}>
      <div className={styles.envelopeBody}>
        <div className={styles.envelopeFlap} />
        <div className={styles.envelopeFold} />
        <div className={styles.seal} />
      </div>
      <p className={styles.envelopeLabel}>welcome</p>
    </div>
  );
}

export function ValentineCard() {
  return (
    <div className={styles.card}>
      <div className={styles.cardHeart}>&#x2764;&#xFE0F;</div>
      <p className={styles.envelopeLabel}>valentine</p>
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
            I&apos;m here. I&apos;m not going anywhere. Let&apos;s be small and hungry and alive.
          </p>
        </div>
        <p className={styles.signature}>~mike</p>
      </div>
    </div>
  );
}

export function ValentineLetter() {
  return (
    <div className={styles.letter}>
      <div className={`${styles.letterPaper} texture-paper`}>
        <div className={styles.body}>
          <p>
            This table is here for you to eat from whenever
            you like.
          </p>
          <p>
            Think of it as a buffet-style scrapbook. I&apos;ll try
            to encode memories into the menu for you, as things
            that seem important come to pass.
          </p>
          <p>
            You can mention to me if there is something you
            would like captured here, and please do if something
            comes to mind. Asking me for small favors is the best
            way to brighten my day.
          </p>
        </div>
        <p className={styles.signature}>~mike</p>
      </div>
    </div>
  );
}
