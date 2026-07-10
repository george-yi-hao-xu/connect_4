import type { Game, Player, State } from './types';
import { write_ln } from './printer';

export async function playGame(game: Game, player1: Player, player2: Player, dims = '5 6'): Promise<State> {
  // check the game status (win/draw/ongoing)
  const loop_engine = async (state: State): Promise<State> => {
    write_ln(game.str_state(state));

    const status = game.get_game_status(state);

    switch (status.tag) {
      case 'Win':
        write_ln(game.str_player(status.player) + ' wins!');
        return state;
      case 'Draw':
        write_ln('Draw...');
        return state;
      case 'Ongoing':
        // make move and pass the updated status to the loop eng
        write_ln(game.str_player(status.player) + "'s turn.");

        const curr_move = await (status.player === 'P1' ? player1.get_next_move(state) : player2.get_next_move(state));

        write_ln(game.str_player(status.player) + ' makes the move ' + game.str_move(curr_move));

        return await loop_engine(game.get_next_state(state, curr_move));
    }
  };

  try {
    return await loop_engine(game.init(dims));
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    write_ln(message);
    throw err;
  }
}
