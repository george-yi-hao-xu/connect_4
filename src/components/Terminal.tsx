import { connect4 } from '../algo/connect4';
import type { State } from '../algo/types';
import './Terminal.scss';

interface TerminalProps {
  state: State | null;
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
