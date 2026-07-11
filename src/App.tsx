import { useState } from 'react';
import { type Connect4State, type Connect4Move } from './games/connect4';
import { useGame } from './context/GameContext';
import { useHumanPlayer } from './context/useHumanPlayer';
import { useGameSession } from './context/useGameSession';

import { Controls } from './components/Controls';
import { Connect4Board } from './components/connect4ui/Connect4Board';
import { Terminal } from './components/Terminal';

export default function App() {
  const game = useGame<Connect4State, Connect4Move>();
  const human = useHumanPlayer<Connect4State, Connect4Move>();
  const [mode, setMode] = useState('human-ai');
  const { state, logs, startGame } = useGameSession(game, human, mode);

  return (
    <main>
      <h1>Connect 4</h1>
      <Controls
        mode={mode}
        onModeChange={setMode}
        onStart={startGame}
      />
      {/* <Status state={state} /> */}
      <Connect4Board state={state} onMove={human.onMove} disabled={!human.isAwaitingMove} />
      <Terminal state={state} logs={logs} />
    </main>
  );
}
