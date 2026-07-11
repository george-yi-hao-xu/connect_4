import { useGame } from '../context/GameContext';
import type { Connect4State, Connect4Move } from '../games/connect4';
import './Status.scss';

interface StatusProps {
  state: Connect4State | null;
}

export function Status({ state }: StatusProps) {
  const game = useGame<Connect4State, Connect4Move>();

  const text = state
    ? game.str_state(state).split('\n')[0]
    : 'Click "Start Game" to begin.';

  return <section className="status">{text}</section>;
}
