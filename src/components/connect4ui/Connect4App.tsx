import { useState } from 'react';
import { type Connect4State, type Connect4Move } from '../../games/connect4';
import { useGame } from '../../context/GameContext';
import { useHumanPlayer } from '../../context/useHumanPlayer';
import { useGameSession } from '../../context/useGameSession';

import { Controls } from '../Controls';
import { Terminal } from '../Terminal';
import { Connect4Board } from './Connect4Board';

export function Connect4App() {
  const game = useGame<Connect4State, Connect4Move>();
  const human = useHumanPlayer<Connect4State, Connect4Move>();
  const [mode, setMode] = useState('human-ai');
  const { state, logs, startGame } = useGameSession(game, human, mode, '5 6');

  return (
    <>
      <h1>Connect 4</h1>
      <Controls
        mode={mode}
        onModeChange={setMode}
        onStart={startGame}
      />
      <Connect4Board state={state} onMove={human.onMove} disabled={!human.isAwaitingMove} />
      <Terminal<Connect4State, Connect4Move> state={state} logs={logs} />
    </>
  );
}
