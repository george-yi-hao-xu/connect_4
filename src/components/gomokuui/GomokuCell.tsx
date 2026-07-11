import type { GomokuPlace } from '../../games/gomoku';
import './GomokuCell.scss';

interface GomokuCellProps {
  place: GomokuPlace;
  isHighlighted?: boolean;
  isWinning?: boolean;
  isDimmed?: boolean;
  onClick?: () => void;
  onMouseEnter?: () => void;
}

const PLACE_CLASS: Record<string, string> = {
  Black: 'black',
  White: 'white',
  None: 'none',
};

export function GomokuCell({
  place,
  isHighlighted = false,
  isWinning = false,
  isDimmed = false,
  onClick,
  onMouseEnter,
}: GomokuCellProps) {
  return (
    <div
      className={`gomoku-cell ${PLACE_CLASS[place]} ${isHighlighted ? 'highlight' : ''} ${isWinning ? 'winning' : ''} ${isDimmed ? 'dimmed' : ''}`}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
    />
  );
}
