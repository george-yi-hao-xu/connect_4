import * as readlineSync from 'readline-sync';
import type { Game, Move, Player, State } from './types';

export function createHumanPlayer(game: Game, name: string): Player {
  const getInputJSLine = (): string => {
    return readlineSync.question('What move do you want to make? ');
  };

  const nextMove = (state: State): Move => {
    const input = getInputJSLine();
    if (input === 'exit') {
      throw new Error('Exiting Game REPL');
    }
    try {
      return game.get_move(input, state);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.log(message);
      return nextMove(state);
    }
  };

  return {
    playerGame: game,
    nextMove,
    playerName: name,
  };
}
