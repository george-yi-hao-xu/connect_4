import { useState } from 'react';
import { GameProvider } from './context/GameContext';
import { GAME_REGISTRY, type GameKey } from './games/registry';
import { Sidebar } from './components/Sidebar';

import './App.scss';

export default function App() {
  const [gameKey, setGameKey] = useState<GameKey>('connect4');

  const entry = GAME_REGISTRY.find((g) => g.key === gameKey)!;
  const GameApp = entry.component;

  return (
    <div className="app">
      <Sidebar game={gameKey} onGameChange={(key) => setGameKey(key as GameKey)} />
      <main className="app-main">
        <GameProvider game={entry.game}>
          <GameApp />
        </GameProvider>
      </main>
    </div>
  );
}
