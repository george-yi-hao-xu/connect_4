import { useEffect, useRef } from 'react';
import { useGame } from '../context/GameContext';
import './Terminal.scss';

interface TerminalProps<S> {
  state: S | null;
  logs: string[];
}

export function Terminal<S, M>({ state, logs }: TerminalProps<S>) {
  const game = useGame<S, M>();
  const terminalRef = useRef<HTMLElement>(null);

  const statusText = state
    ? game.str_state(state).split('\n')[0]
    : 'Terminal Started...';

  useEffect(() => {
    const el = terminalRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [logs]);

  return (
    <section ref={terminalRef} className="terminal">
      <div className="statusLine">{statusText}</div>
      {logs.map((line, index) => (
        <div key={index} className="logLine">
          {line}
        </div>
      ))}
    </section>
  );
}
