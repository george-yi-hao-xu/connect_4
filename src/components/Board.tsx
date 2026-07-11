import { useEffect, useRef, useState } from 'react';
import { get_winning_cells } from '../games/connect4';
import type { Connect4State } from '../games/connect4';
import type { CellCoord, WhichPlayer } from '../algo/types';
import { Arrow } from './Arrow';
import { Cell } from './Cell';
import './Board.scss';

interface BoardProps {
  state: Connect4State | null;
  onColumnClick?: (col: number) => void;
  disabled?: boolean;
}

const PLAYER_CLASS: Record<WhichPlayer, string> = {
  P1: 'red',
  P2: 'yellow',
};

export function Board({ state, onColumnClick, disabled = false }: BoardProps) {
  const [hoveredCol, setHoveredCol] = useState<number | null>(null);
  const [droppingCells, setDroppingCells] = useState<CellCoord[]>([]);
  const prevMatrixRef = useRef<Connect4State['matrix'] | null>(null);

  useEffect(() => {
    if (disabled) setHoveredCol(null);
  }, [disabled]);

  useEffect(() => {
    if (!state) {
      prevMatrixRef.current = null;
      return;
    }

    const matrix = state.matrix;
    const prev = prevMatrixRef.current;
    prevMatrixRef.current = matrix;

    if (!prev || prev.length !== matrix.length || prev[0].length !== matrix[0].length) {
      return;
    }

    const newlyPlaced: CellCoord[] = [];
    for (let col = 0; col < matrix.length; col++) {
      for (let row = 0; row < matrix[col].length; row++) {
        if (prev[col][row] === 'None' && matrix[col][row] !== 'None') {
          newlyPlaced.push({ col, row });
        }
      }
    }

    if (newlyPlaced.length === 0) return;

    setDroppingCells(newlyPlaced);
    const timer = setTimeout(() => setDroppingCells([]), 500);
    return () => clearTimeout(timer);
  }, [state]);

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
          <Arrow
            key={`arrow-${col}`}
            isVisible={isInteractive && hoveredCol === col}
            playerClass={currentPlayerClass}
          />
        ))}
        {Array.from({ length: height }, (_, row) =>
          Array.from({ length: width }, (_, col) => {
            const place = matrix[col][row];
            const isWinning = winningCells?.some(
              (c) => c.col === col && c.row === row,
            ) ?? false;
            const isDimmed = winningCells !== null && !isWinning;
            const isDropping = droppingCells.some(
              (c) => c.col === col && c.row === row,
            );

            return (
              <Cell
                key={`${col}-${row}`}
                place={place}
                isHighlighted={isInteractive && hoveredCol === col}
                isWinning={isWinning}
                isDimmed={isDimmed}
                isDropping={isDropping}
                dropOffset={
                  isDropping
                    ? `calc(-${row + 1} * (4.5rem + 0.5rem) - 2rem)`
                    : undefined
                }
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
