import { useGame } from '../context/GameContext';
import type { Connect4State, Connect4Move } from '../games/connect4';
import './Terminal.scss';

interface TerminalProps {
  state: Connect4State | null;
  logs: string[];
}

export function Terminal({ state, logs }: TerminalProps) {
  const game = useGame<Connect4State, Connect4Move>();

  const statusText = state
    ? game.str_state(state).split('\n')[0]
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
