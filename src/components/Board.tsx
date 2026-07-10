import { useEffect, useState } from 'react';
import { connect4, get_winning_cells } from '../algo/connect4';
import type { State, WhichPlayer } from '../algo/types';
import './Board.scss';

interface BoardProps {
  state: State | null;
  onColumnClick?: (col: number) => void;
  disabled?: boolean;
}

const PLACE_CLASS: Record<string, string> = {
  Red: 'red',
  Yellow: 'yellow',
  None: 'none',
};

const PLAYER_CLASS: Record<WhichPlayer, string> = {
  P1: 'red',
  P2: 'yellow',
};

export function Board({ state, onColumnClick, disabled = false }: BoardProps) {
  const [hoveredCol, setHoveredCol] = useState<number | null>(null);

  useEffect(() => {
    if (disabled) setHoveredCol(null);
  }, [disabled]);

  if (!state) {
    return <section className="board" />;
  }

  const matrix = state.matrix;
  const width = matrix.length;
  const height = width > 0 ? matrix[0].length : 0;

  const currentPlayerClass =
    state.status.tag === 'Ongoing'
      ? PLAYER_CLASS[state.status.player]
      : 'none';
  const isOngoing = state.status.tag === 'Ongoing';
  const winningCells =
    state.status.tag === 'Win' ? get_winning_cells(state) : null;

  const isInteractive = isOngoing && !disabled;

  return (
    <section className="board">
      <div
        className={`grid ${disabled ? 'disabled' : ''}`}
        style={{
          gridTemplateColumns: `repeat(${width}, 1fr)`,
          gridTemplateRows: `auto repeat(${height}, 1fr)`,
        }}
        onMouseLeave={() => setHoveredCol(null)}
      >
        {Array.from({ length: width }, (_, col) => (

          // ARROW
          <div
            key={`arrow-${col}`}
            className={`arrow ${isInteractive && hoveredCol === col ? 'visible' : ''} ${currentPlayerClass}`}
            aria-hidden="true"
          >
            ▼
          </div>
        ))}
        {Array.from({ length: height }, (_, row) =>
          Array.from({ length: width }, (_, col) => {
            const place = matrix[col][row];
            const isWinning = winningCells?.some(
              (c) => c.col === col && c.row === row,
            ) ?? false;
            const isDimmed = winningCells !== null && !isWinning;

            // COIN
            return (
              <div
                key={`${col}-${row}`}
                className={`cell ${PLACE_CLASS[place]} ${isInteractive && hoveredCol === col ? 
                  'highlight' : ''} ${isWinning ? 'winning' : ''} ${isDimmed ? 'dimmed' : ''}`}
                onClick={() => onColumnClick?.(col)}
                onMouseEnter={() => setHoveredCol(col)}
              />
            );
          }),
        )}
      </div>
    </section>
  );
}
