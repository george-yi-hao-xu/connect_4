import type { Game, WhichPlayer } from '../../algo/types';

export interface Candidate<TWeights> {
  name: string;
  weights: TWeights;
}

export interface CandidateRecord {
  elo: number;
  games: number;
  wins: number;
  losses: number;
  draws: number;
  points: number;
  total_moves: number;
}

export interface GameResult {
  red: string;
  yellow: string;
  winner: string | 'Draw';
  winner_player: WhichPlayer | 'Draw';
  moves: number;
}

export interface MatchJob<TWeights> {
  red: Candidate<TWeights>;
  yellow: Candidate<TWeights>;
  seed: number;
}

export interface SearchAdapter<TWeights> {
  readonly name: string;
  readonly default_dims: string;
  readonly default_depth: number;

  /** Convert weights to a flat gene array. */
  flatten(weights: TWeights): number[];

  /** Rebuild weights from a flat gene array (must enforce game-specific constraints). */
  unflatten(genes: number[]): TWeights;

  /** Generate random weights within the search space. */
  random_weights(random: () => number): TWeights;

  /** Create a game instance from weights for a specific player. */
  create_game(weights: TWeights, player: WhichPlayer): Game<unknown, unknown>;

  /** Format weights for logging. */
  format_weights(weights: TWeights): string;
}
