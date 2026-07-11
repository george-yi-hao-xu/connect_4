import { useState } from 'react';
import { type Connect4State, type Connect4Move } from './games/connect4';
import { useGame } from './context/GameContext';
import { useHumanPlayer } from './context/useHumanPlayer';
import { useGameSession } from './context/useGameSession';

import { GameUI } from './components/GameUI';

export default function App() {
  const game = useGame<Connect4State, Connect4Move>();
  const human = useHumanPlayer<Connect4State, Connect4Move>();
  const [mode, setMode] = useState('human-ai');
  const { state, logs, startGame } = useGameSession(game, human, mode);

  return (
    <GameUI
      mode={mode}
      state={state}
      logs={logs}
      isInteractive={human.isAwaitingMove}
      onModeChange={setMode}
      onStart={startGame}
      onMove={human.onMove}
    />
  );
}
