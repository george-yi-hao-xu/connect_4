import './Controls.scss';

interface ControlsProps {
  mode: string;
  onModeChange: (mode: string) => void;
  onStart: () => void;
  running: boolean;
}

export function Controls({ mode, onModeChange, onStart, running }: ControlsProps) {
  return (
    <section className="controls">
      <label htmlFor="mode" className="label">Mode:</label>
      <select
        id="mode"
        className="select"
        value={mode}
        onChange={(e) => onModeChange(e.target.value)}
        disabled={running}
      >
        <option value="human-ai">Human vs AI</option>
        <option value="human">Human vs Human</option>
        <option value="ai">AI vs AI</option>
      </select>
      <button
        className="button"
        onClick={onStart}
        disabled={running}
      >
        Start Game
      </button>
    </section>
  );
}
