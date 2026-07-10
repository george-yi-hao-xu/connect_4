import type { Place } from '../algo/types';
import './Cell.scss';

interface CellProps {
  place: Place;
  isHighlighted?: boolean;
  isWinning?: boolean;
  isDimmed?: boolean;
  isDropping?: boolean;
  dropOffset?: string;
  onClick?: () => void;
  onMouseEnter?: () => void;
}

const PLACE_CLASS: Record<string, string> = {
  Red: 'red',
  Yellow: 'yellow',
  None: 'none',
};

export function Cell({
  place,
  isHighlighted = false,
  isWinning = false,
  isDimmed = false,
  isDropping = false,
  dropOffset,
  onClick,
  onMouseEnter,
}: CellProps) {
  return (
    <div
      className={`cell ${PLACE_CLASS[place]} ${isHighlighted ? 'highlight' : ''} ${isWinning ? 'winning' : ''} ${isDimmed ? 'dimmed' : ''} ${isDropping ? 'dropping' : ''}`}
      style={
        dropOffset
          ? ({ '--drop-offset': dropOffset } as React.CSSProperties)
          : undefined
      }
      onClick={onClick}
      onMouseEnter={onMouseEnter}
    />
  );
}
