import { useState } from 'react';
import { type GomokuState, type GomokuMove } from '../../games/gomoku';
import { useGame } from '../../context/GameContext';
import { useHumanPlayer } from '../../context/useHumanPlayer';
import { useGameSession } from '../../context/useGameSession';

import { Controls } from '../Controls';
import { Terminal } from '../Terminal';
import { GomokuBoard } from './GomokuBoard';

export function GomokuApp() {
  const game = useGame<GomokuState, GomokuMove>();
  const human = useHumanPlayer<GomokuState, GomokuMove>();
  const [mode, setMode] = useState('human-ai');
  const { state, logs, startGame } = useGameSession(game, human, mode, '15 15', 4);

  return (
    <>
      <h1>Gomoku</h1>
      <Controls
        mode={mode}
        onModeChange={setMode}
        onStart={startGame}
      />
      <GomokuBoard state={state} onMove={human.onMove} disabled={!human.isAwaitingMove} />
      <Terminal<GomokuState, GomokuMove> state={state} logs={logs} />
    </>
  );
}
