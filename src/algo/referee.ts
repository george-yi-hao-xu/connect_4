import type { Game, Player } from './types';
import { write_ln } from './printer';

export async function playGame<S, M>(
  game: Game<S, M>,
  player1: Player<S, M>,
  player2: Player<S, M>,
  dims = '5 6',
): Promise<S> {
  // check the game status (win/draw/ongoing)
  const loop_engine = async (state: S): Promise<S> => {
    write_ln(game.str_state(state));

    const status = game.get_game_status(state);

    switch (status.tag) {
      case 'Win': {
        const winner = status.player === 'P1' ? player1 : player2;
        write_ln(`${game.str_player(status.player)} (${winner.player_name}) wins!`);
        return state;
      }
      case 'Draw':
        write_ln('Draw...');
        return state;
      case 'Ongoing':
        // make move and pass the updated status to the loop eng
        const currentPlayer = status.player === 'P1' ? player1 : player2;
        write_ln(`${game.str_player(status.player)} (${currentPlayer.player_name})'s turn.`);

        const curr_move = await currentPlayer.get_next_move(state);

        write_ln(`${game.str_player(status.player)} (${currentPlayer.player_name}) makes the move ${game.str_move(curr_move)}`);

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
