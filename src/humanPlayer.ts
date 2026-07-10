import * as readlineSync from 'readline-sync';
import type { Game, Move, Player, PlayerName, State } from './types';
import { write_ln } from './printer';

export function create_human_player(game: Game, name: PlayerName): Player {
  const get_input = (): string => {
    return readlineSync.question('What move do you want to make? ');
  };

  const get_next_move = (state: State): Move => {
    const input = get_input();
    if (input === 'exit') {
      throw new Error('Exiting Game REPL');
    }
    try {
      return game.get_move(input, state);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      write_ln(message);
      return get_next_move(state);
    }
  };

  return {
    game_ref: game,
    get_next_move,
    player_name: name,
  };
}
