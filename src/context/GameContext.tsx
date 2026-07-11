import { createContext, useContext, type ReactNode } from 'react';
import type { Game } from '../algo/types';

const GameContext = createContext<Game<unknown, unknown> | null>(null);

export function GameProvider({
  game,
  children,
}: {
  game: Game<unknown, unknown>;
  children: ReactNode;
}) {
  return (
    <GameContext.Provider value={game}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame<S, M>(): Game<S, M> {
  const game = useContext(GameContext);
  if (game === null) {
    throw new Error('useGame must be used within a <GameProvider>');
  }
  return game as Game<S, M>;
}
