import { connect4 } from '../connect4';
import type { State } from '../types';
import styles from './Status.module.css';

interface StatusProps {
  state: State | null;
}

export function Status({ state }: StatusProps) {
  const text = state
    ? connect4.str_state(state).split('\n')[0]
    : 'Click "Start Game" to begin.';

  return <section className={styles.status}>{text}</section>;
}
