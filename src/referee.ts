import type { Game, Player, State } from './types';

export function playGame( game: Game, player1: Player, player2: Player, dims = '5 6') {
  // check the game status (win/draw/ongoing)
  const loop_engine = (state: State): void => {
    console.log(game.stringOfState(state));

    const status = game.get_game_status(state);

    switch (status.tag) {
      case 'Win':
        console.log(game.stringOfPlayer(status.player) + ' wins!');
        return;
      case 'Draw':
        console.log('Draw...');
        return;
      case 'Ongoing':
        // make move and pass the updated status to the loop eng
        console.log(game.stringOfPlayer(status.player) + "'s turn.");

        const theMove = status.player === 'P1' ? player1.nextMove(state) : player2.nextMove(state);

        console.log( game.stringOfPlayer(status.player) + ' makes the move ' + game.stringOfMove(theMove),);

        loop_engine(game.get_next_state(state, theMove));
        return;
    }
  };

  try {
    loop_engine(game.init(dims));
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.log(message);
  }
}
