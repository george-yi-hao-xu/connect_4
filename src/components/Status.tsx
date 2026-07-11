import { useGame } from '../context/GameContext';
import './Status.scss';

interface StatusProps<S> {
  state: S | null;
}

export function Status<S, M>({ state }: StatusProps<S>) {
  const game = useGame<S, M>();

  const text = state
    ? game.str_state(state).split('\n')[0]
    : 'Click "Start Game" to begin.';

  return <section className="status">{text}</section>;
}
