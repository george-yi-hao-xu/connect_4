import styles from './Terminal.module.css';

interface TerminalProps {
  logs: string[];
}

export function Terminal({ logs }: TerminalProps) {
  return (
    <section className={styles.terminal}>
      {logs.map((line, index) => (
        <div key={index} className={styles.logLine}>
          {line}
        </div>
      ))}
    </section>
  );
}
