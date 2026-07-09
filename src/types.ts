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

  initialState(dims: string): State;
  legalMoves(state: State): Move[];
  gameStatus(state: State): Status;
  nextState(state: State, move: Move): State;
  moveOfString(input: string, state: State): Move;
  estimateValue(state: State): number;
}

export interface Player {
  playerGame: Game;
  nextMove(state: State): Move;
  playerName: string;
}
