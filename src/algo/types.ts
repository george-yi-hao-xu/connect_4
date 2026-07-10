/**
 * Shared types and interfaces for the Connect4 game.
 * Mirrors the original ReasonML Game and Player module signatures.
 */

export type WhichPlayer = 'P1' | 'P2';
export type PlayerName = 'MAX' | 'MIN';

export type Status =
  | { tag: 'Win'; player: WhichPlayer }
  | { tag: 'Draw' }
  | { tag: 'Ongoing'; player: WhichPlayer };

export type Place = 'Red' | 'Yellow' | 'None';

export interface Move {
  tag: 'Move';
  col: number;
}

export interface State {
  status: Status;
  matrix: Place[][];
}

export interface Game {
  str_player(player: WhichPlayer): string;
  str_state(state: State): string;
  str_move(move: Move): string;

  init(dims: string): State;
  get_legal_moves(state: State): Move[];
  get_game_status(state: State): Status;
  get_next_state(state: State, move: Move): State;
  get_move(input: string, state: State): Move;
  get_score(state: State): number;
}

export interface Player {
  game_ref: Game;
  get_next_move(state: State): Move | Promise<Move>;
  player_name: string;
}
