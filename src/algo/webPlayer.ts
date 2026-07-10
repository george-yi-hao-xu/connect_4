import type { Game, Move, Player, PlayerName, State } from './types';

export function create_web_human_player(
  game: Game,
  name: PlayerName,
  requestMove: (state: State) => Move | Promise<Move>,
): Player {
  return {
    game_ref: game,
    player_name: name,
    get_next_move: requestMove,
  };
}
