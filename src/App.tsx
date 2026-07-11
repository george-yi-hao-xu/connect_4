import { useEffect, useState } from 'react';
import { GameProvider } from './context/GameContext';
import { GAME_REGISTRY, type GameKey } from './games/registry';
import { get_saved_game_key, save_game_key } from './games/gameStorage';
import { Sidebar } from './components/Sidebar';

import './App.scss';

export default function App() {
  const [game_key, set_game_key] = useState<GameKey>(get_saved_game_key);

  useEffect(() => {
    save_game_key(game_key);
  }, [game_key]);

  const entry = GAME_REGISTRY.find((g) => g.key === game_key)!;
  const GameApp = entry.component;

  return (
    <div className="app">
      <Sidebar game={game_key} onGameChange={(key) => set_game_key(key as GameKey)} />
      <main className="app-main">
        <GameProvider game={entry.game}>
          <GameApp />
        </GameProvider>
      </main>
    </div>
  );
}
