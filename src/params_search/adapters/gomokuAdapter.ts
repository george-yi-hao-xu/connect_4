import type { Game, WhichPlayer } from '../../algo/types';
import {
  create_gomoku,
  type GomokuScoreWeights,
  type GomokuState,
  type GomokuMove,
} from '../../games/gomoku';
import type { SearchAdapter } from '../core/types';
import { gen_seed, rand_clamp } from '../randomUtils';

const WIN_SCORE = 1000;

function _clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function _round(value: number): number {
  return Math.round(value * 1000) / 1000;
}

export function get_rand_gomoku_weights(
  random: () => number,
): GomokuScoreWeights {
  return {
    win: WIN_SCORE,
    len4_open1: _round(rand_clamp(random, 0, 1000)),
    len3_open2: _round(rand_clamp(random, 0, 1000)),
    len3_open1: _round(rand_clamp(random, 0, 1000)),
    len2_open2: _round(rand_clamp(random, 0, 1000)),
    len2_open1: _round(rand_clamp(random, 0, 1000)),
  };
}

export function flatten_gomoku_weights(
  weights: GomokuScoreWeights,
): number[] {
  return [
    weights.len4_open1,
    weights.len3_open2,
    weights.len3_open1,
    weights.len2_open2,
    weights.len2_open1,
  ];
}

export function unflatten_gomoku_weights(genes: number[]): GomokuScoreWeights {
  const safe = genes.map((v) => _clamp(v, 0, 1000));
  return {
    win: WIN_SCORE,
    len4_open1: _round(safe[0] ?? 0),
    len3_open2: _round(safe[1] ?? 0),
    len3_open1: _round(safe[2] ?? 0),
    len2_open2: _round(safe[3] ?? 0),
    len2_open1: _round(safe[4] ?? 0),
  };
}

export function create_candidate_gomoku_game(
  weights: GomokuScoreWeights,
  _player: WhichPlayer,
): Game<GomokuState, GomokuMove> {
  // Symmetric evaluation: both players use the same weights.
  return create_gomoku(weights);
}

export const gomoku_adapter: SearchAdapter<GomokuScoreWeights> = {
  name: 'gomoku',
  default_dims: '15 15',
  default_depth: 2,

  flatten: flatten_gomoku_weights,

  unflatten: unflatten_gomoku_weights,

  random_weights: (random) => get_rand_gomoku_weights(random ?? gen_seed(1)),

  create_game: (weights, player) =>
    create_candidate_gomoku_game(weights, player) as Game<unknown, unknown>,

  format_weights: (weights) => JSON.stringify(weights),
};
