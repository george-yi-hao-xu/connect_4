/**
 * Shared types and interfaces for the Connect4 game.
 * Mirrors the original ReasonML Game and Player module signatures.
 */

export type WhichPlayer = 'P1' | 'P2';

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
  stringOfPlayer(player: WhichPlayer): string;
  stringOfState(state: State): string;
  stringOfMove(move: Move): string;

  init(dims: string): State;
  get_legal_moves(state: State): Move[];
  get_game_status(state: State): Status;
  get_next_state(state: State, move: Move): State;
  get_move(input: string, state: State): Move;
  get_score(state: State): number;
}

export interface Player {
  playerGame: Game;
  nextMove(state: State): Move;
  playerName: string;
}
