import type { Connect4State, Connect4Move } from '../games/connect4';
import { Board } from './Board';
import { Controls } from './Controls';
import { Terminal } from './Terminal';

interface GameUIProps {
  mode: string;
  state: Connect4State | null;
  logs: string[];
  isInteractive: boolean;
  onModeChange: (mode: string) => void;
  onStart: () => void;
  onMove: (move: Connect4Move) => void;
}

export function GameUI({
  mode,
  state,
  logs,
  isInteractive,
  onModeChange,
  onStart,
  onMove,
}: GameUIProps) {
  return (
    <main>
      <h1>Connect 4</h1>
      <Controls mode={mode} onModeChange={onModeChange} onStart={onStart} />
      {/* <Status state={state} /> */}
      <Board state={state} onMove={onMove} disabled={!isInteractive} />
      <Terminal state={state} logs={logs} />
    </main>
  );
}
