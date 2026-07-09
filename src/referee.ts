import type { Game, Player, State } from './types';

export function playGame(
  game: Game,
  player1: Player,
  player2: Player,
  dims = '5 6',
): void {
  const gameLoop = (state: State): void => {
    console.log(game.stringOfState(state));
    const status = game.gameStatus(state);
    switch (status.tag) {
      case 'Win':
        console.log(game.stringOfPlayer(status.player) + ' wins!');
        return;
      case 'Draw':
        console.log('Draw...');
        return;
      case 'Ongoing':
        console.log(game.stringOfPlayer(status.player) + "'s turn.");
        const theMove = status.player === 'P1' ? player1.nextMove(state) : player2.nextMove(state);
        console.log(
          game.stringOfPlayer(status.player) + ' makes the move ' + game.stringOfMove(theMove),
        );
        gameLoop(game.nextState(state, theMove));
        return;
    }
  };

  try {
    gameLoop(game.initialState(dims));
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.log(message);
  }
}
