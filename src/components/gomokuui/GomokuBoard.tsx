import { useEffect, useState } from 'react';
import { get_winning_cells } from '../../games/gomoku';
import type { GomokuState, GomokuMove } from '../../games/gomoku';
import { useGame } from '../../context/GameContext';
import type { CellCoord } from '../../algo/types';
import { GomokuCell } from './GomokuCell';
import './GomokuBoard.scss';

interface GomokuBoardProps {
  state: GomokuState | null;
  onMove?: (move: GomokuMove) => void;
  disabled?: boolean;
}

export function GomokuBoard({ state, onMove, disabled = false }: GomokuBoardProps) {
  const game = useGame<GomokuState, GomokuMove>();
  const [hoveredCell, setHoveredCell] = useState<CellCoord | null>(null);

  useEffect(() => {
    if (disabled) setHoveredCell(null);
  }, [disabled]);

  const handleCellClick = (row: number, col: number) => {
    if (!state || disabled) return;

    const legal = game.get_legal_moves(state).some((m) => m.row === row && m.col === col);
    if (!legal) return;

    onMove?.({ tag: 'Move', row, col });
  };

  if (!state) {
    return <section className="gomoku-board" />;
  }

  const matrix = state.matrix;
  const height = matrix.length;
  const width = height > 0 ? matrix[0].length : 0;

  const isOngoing = state.status.tag === 'Ongoing';
  const winningCells = state.status.tag === 'Win' ? get_winning_cells(state) : null;

  const isInteractive = isOngoing && !disabled;

  return (
    <section className="gomoku-board">
      <div
        className={`gomoku-grid ${disabled ? 'disabled' : ''}`}
        onMouseLeave={() => setHoveredCell(null)}
      >
        {Array.from({ length: height }, (_, row) => (
          <div key={`row-${row}`} className="gomoku-grid-row">
            {Array.from({ length: width }, (_, col) => {
              const place = matrix[row][col];
              const isWinning =
                winningCells?.some((c) => c.col === col && c.row === row) ?? false;
              const isDimmed = winningCells !== null && !isWinning;
              const isHovered = hoveredCell?.row === row && hoveredCell?.col === col;
              const isHighlighted =
                isInteractive && isHovered && place === 'None';

              return (
                <div
                  key={`${row}-${col}`}
                  className="gomoku-grid-cell"
                  onMouseEnter={() => setHoveredCell({ col, row })}
                >
                  <GomokuCell
                    place={place}
                    isHighlighted={isHighlighted}
                    isWinning={isWinning}
                    isDimmed={isDimmed}
                    onClick={() => handleCellClick(row, col)}
                  />
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </section>
  );
}
