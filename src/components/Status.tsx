import type { Connect4State } from '../games/connect4';
import { connect4 } from '../games/connect4';
import './Status.scss';

interface StatusProps {
  state: Connect4State | null;
}

export function Status({ state }: StatusProps) {
  const text = state
    ? connect4.str_state(state).split('\n')[0]
    : 'Click "Start Game" to begin.';

  return <section className="status">{text}</section>;
}
