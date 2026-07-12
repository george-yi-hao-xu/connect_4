import type { WhichPlayer } from '../algo/types';
import {
  create_connect4,
  type Connect4ChainWeights,
} from '../games/connect4';
import type { Candidate } from './connect4Search.types';
import { gen_seed, rand_clamp } from './randomUtils';

function _round(value: number): number {
  return Math.round(value * 1000) / 1000;
}

export function get_rand_weights(random: () => number): Connect4ChainWeights {
  const chain1 = rand_clamp(random, 0, 1000);
  const chain2 = rand_clamp(random, chain1, 1000);
  const chain3 = rand_clamp(random, chain2, 1000);

  return {
    chain3: _round(chain3),
    chain2: _round(chain2),
    chain1: _round(chain1),
  };
}

export function create_candidates(count: number, seed: number): Candidate[] {
  const _r = gen_seed(seed);

  return Array.from({ length: count }, (_, index) => ({
    name: `w${String(index + 1).padStart(3, '0')}`,
    self: get_rand_weights(_r),
    opponent: get_rand_weights(_r),
  }));
}

export function create_candidate_game(candidate: Candidate, player: WhichPlayer) {
  return player === 'P1'
    ? create_connect4({ red: candidate.self, yellow: candidate.opponent })
    : create_connect4({ red: candidate.opponent, yellow: candidate.self });
}
