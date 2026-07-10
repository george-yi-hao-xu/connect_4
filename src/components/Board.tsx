import { connect4 } from '../algo/connect4';
import type { State } from '../algo/types';
import './Board.scss';

interface BoardProps {
  state: State | null;
  onColumnClick?: (col: number) => void;
}

const PLACE_CLASS: Record<string, string> = {
  Red: 'red',
  Yellow: 'yellow',
  None: 'none',
};

export function Board({ state, onColumnClick }: BoardProps) {
  if (!state) {
    return <section className="board" />;
  }

  const matrix = state.matrix;
  const width = matrix.length;
  const height = width > 0 ? matrix[0].length : 0;

  return (
    <section className="board">
      <div
        className="grid"
        style={{ gridTemplateColumns: `repeat(${width}, 1fr)` }}
      >
        {Array.from({ length: height }, (_, row) =>
          Array.from({ length: width }, (_, col) => {
            const place = matrix[col][row];
            return (
              <div
                key={`${col}-${row}`}
                className={`cell ${PLACE_CLASS[place]}`}
                onClick={() => onColumnClick?.(col)}
              />
            );
          }),
        )}
      </div>
    </section>
  );
}
