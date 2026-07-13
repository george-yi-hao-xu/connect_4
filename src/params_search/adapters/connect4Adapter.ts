import type { Game, WhichPlayer } from '../../algo/types';
import {
  create_connect4,
  type Connect4ChainWeights,
  type Connect4Move,
  type Connect4State,
} from '../../games/connect4';
import type { SearchAdapter } from '../core/types';
import { gen_seed, rand_clamp } from '../randomUtils';

function _clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function _round(value: number): number {
  return Math.round(value * 1000) / 1000;
}

export function get_rand_connect4_weights(
  random: () => number,
): Connect4ChainWeights {
  const chain1 = rand_clamp(random, 0, 1000);
  const chain2 = rand_clamp(random, chain1, 1000);
  const chain3 = rand_clamp(random, chain2, 1000);

  return {
    chain1: _round(chain1),
    chain2: _round(chain2),
    chain3: _round(chain3),
  };
}

export function flatten_connect4_weights(
  weights: Connect4ChainWeights,
): number[] {
  return [weights.chain1, weights.chain2, weights.chain3];
}

export function unflatten_connect4_weights(genes: number[]): Connect4ChainWeights {
  const sorted = genes
    .map((v) => _clamp(v, 0, 1000))
    .sort((a, b) => a - b);

  return {
    chain1: _round(sorted[0]),
    chain2: _round(sorted[1]),
    chain3: _round(sorted[2]),
  };
}

export function create_candidate_connect4_game(
  weights: Connect4ChainWeights,
  _player: WhichPlayer,
): Game<Connect4State, Connect4Move> {
  // Symmetric evaluation: both players use the same weights.
  return create_connect4({ red: weights, yellow: weights });
}

export const connect4_adapter: SearchAdapter<Connect4ChainWeights> = {
  name: 'connect4',
  default_dims: '5 6',
  default_depth: 3,

  flatten: flatten_connect4_weights,

  unflatten: unflatten_connect4_weights,

  random_weights: (random) => get_rand_connect4_weights(random ?? gen_seed(1)),

  create_game: (weights, player) =>
    create_candidate_connect4_game(weights, player) as Game<unknown, unknown>,

  format_weights: (weights) => JSON.stringify(weights),
};
