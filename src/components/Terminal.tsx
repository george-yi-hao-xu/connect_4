import type { Connect4State } from '../games/connect4';
import { connect4 } from '../games/connect4';
import './Terminal.scss';

interface TerminalProps {
  state: Connect4State | null;
  logs: string[];
}

export function Terminal({ state, logs }: TerminalProps) {
  const statusText = state
    ? connect4.str_state(state).split('\n')[0]
    : 'Terminal Started...';

  return (
    <section className="terminal">
      <div className="statusLine">{statusText}</div>
      {logs.map((line, index) => (
        <div key={index} className="logLine">
          {line}
        </div>
      ))}
    </section>
  );
}
