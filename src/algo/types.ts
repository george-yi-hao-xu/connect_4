/**
 * Shared types and interfaces for generic two-player games.
 * Mirrors the original ReasonML Game and Player module signatures.
 */

export type WhichPlayer = 'P1' | 'P2';
export type PlayerName = 'MAX' | 'MIN';

export type Status =
  | { tag: 'Win'; player: WhichPlayer }
  | { tag: 'Draw' }
  | { tag: 'Ongoing'; player: WhichPlayer };

export interface CellCoord {
  col: number;
  row: number;
}

export interface Game<S, M> {
  str_player(player: WhichPlayer): string;
  str_state(state: S): string;
  str_move(move: M): string;

  init(dims: string): S;
  get_legal_moves(state: S): M[];
  get_game_status(state: S): Status;
  get_next_state(state: S, move: M): S;
  get_move(input: string, state: S): M;
  get_score(state: S): number;
}

export interface Player<S, M> {
  game_ref: Game<S, M>;
  get_next_move(state: S): M | Promise<M>;
  player_name: string;
}
