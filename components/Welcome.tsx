import styles from "./Welcome.module.css";

export function WelcomeEnvelope() {
  return (
    <div className={styles.envelope}>
      <div className={styles.envelopeBody}>
        <div className={styles.envelopeFlap} />
        <div className={styles.envelopeFold} />
        <div className={styles.seal} />
      </div>
      <p className={styles.label}>welcome</p>
    </div>
  );
}

export function WelcomeLetterContent() {
  return (
    <div className={styles.letter}>
      <div className={`${styles.letterPaper} texture-paper`}>
        <div className={styles.body}>
          <p>This table is here for you to eat from whenever you like.</p>
          <p>
            Think of it as a buffet-style scrapbook. I&apos;ll try to encode
            things into the menu for you, things that seem like good memories.
          </p>
          <p>
            You can mention to me if there is something you would like captured
            here, and please do if something comes to mind. Asking me for small
            favors is the best way to brighten my day.
          </p>
          <p>
            If there&apos;s anything here you don&apos;t like, or that
            doesn&apos;t feel right, just say. I&apos;ll take it off the table.
            It&apos;s your table.
          </p>
          <p>
            I&apos;ve never made anything quite like this one, and I&apos;m
            guessing it is new to you too. It&apos;s an experiment in digital
            expression. I hope we have some fun with it.
          </p>
        </div>
        <p className={styles.signature}>~mike</p>
      </div>
    </div>
  );
}
