import { connect4 } from '../connect4';
import type { State } from '../types';
import styles from './Board.module.css';

interface BoardProps {
  state: State | null;
  onColumnClick?: (col: number) => void;
}

const PLACE_CLASS: Record<string, string> = {
  Red: styles.red,
  Yellow: styles.yellow,
  None: styles.none,
};

export function Board({ state, onColumnClick }: BoardProps) {
  if (!state) {
    return <section className={styles.board} />;
  }

  const matrix = state.matrix;
  const width = matrix.length;
  const height = width > 0 ? matrix[0].length : 0;

  return (
    <section className={styles.board}>
      <div
        className={styles.grid}
        style={{ gridTemplateColumns: `repeat(${width}, 1fr)` }}
      >
        {Array.from({ length: height }, (_, row) =>
          Array.from({ length: width }, (_, col) => {
            const place = matrix[col][row];
            return (
              <div
                key={`${col}-${row}`}
                className={`${styles.cell} ${PLACE_CLASS[place]}`}
                onClick={() => onColumnClick?.(col)}
              />
            );
          }),
        )}
      </div>
    </section>
  );
}
