import './Arrow.scss';

interface ArrowProps {
  isVisible: boolean;
  playerClass: string;
}

export function Arrow({ isVisible, playerClass }: ArrowProps) {
  return (
    <div
      className={`arrow ${isVisible ? 'visible' : ''} ${playerClass}`}
      aria-hidden="true"
    >
      ▼
    </div>
  );
}
