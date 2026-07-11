import type { Game, Player, PlayerName } from './types';

export function create_web_human_player<S, M>(
  game: Game<S, M>,
  name: PlayerName,
  requestMove: (state: S) => M | Promise<M>,
): Player<S, M> {
  return {
    game_ref: game,
    player_name: name,
    get_next_move: requestMove,
  };
}
