import type { Game, Player, State } from './types';
import { write_ln } from './printer';

export function playGame( game: Game, player1: Player, player2: Player, dims = '5 6') {
  // check the game status (win/draw/ongoing)
  const loop_engine = (state: State): void => {
    write_ln(game.str_state(state));

    const status = game.get_game_status(state);

    switch (status.tag) {
      case 'Win':
        write_ln(game.str_player(status.player) + ' wins!');
        return;
      case 'Draw':
        write_ln('Draw...');
        return;
      case 'Ongoing':
        // make move and pass the updated status to the loop eng
        write_ln(game.str_player(status.player) + "'s turn.");

        const theMove = status.player === 'P1' ? player1.get_next_move(state) : player2.get_next_move(state);

        write_ln( game.str_player(status.player) + ' makes the move ' + game.str_move(theMove),);

        loop_engine(game.get_next_state(state, theMove));
        return;
    }
  };

  try {
    loop_engine(game.init(dims));
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    write_ln(message);
  }
}
