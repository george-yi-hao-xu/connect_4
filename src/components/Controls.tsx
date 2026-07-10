import styles from './Controls.module.css';

interface ControlsProps {
  mode: string;
  onModeChange: (mode: string) => void;
  onStart: () => void;
  running: boolean;
}

export function Controls({ mode, onModeChange, onStart, running }: ControlsProps) {
  return (
    <section className={styles.controls}>
      <label htmlFor="mode" className={styles.label}>Mode:</label>
      <select
        id="mode"
        className={styles.select}
        value={mode}
        onChange={(e) => onModeChange(e.target.value)}
        disabled={running}
      >
        <option value="human-ai">Human vs AI</option>
        <option value="human">Human vs Human</option>
        <option value="ai">AI vs AI</option>
      </select>
      <button
        className={styles.button}
        onClick={onStart}
        disabled={running}
      >
        Start Game
      </button>
    </section>
  );
}
