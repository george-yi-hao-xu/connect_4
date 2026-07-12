import type { Candidate, CandidateRecord } from './connect4Search.types';

// 把 Candidate 展平成 3 个数字的“基因数组”
// 顺序：[w1, w2, w3]
export function flatten_weights(candidate: Candidate): number[] {
  return [
    candidate.weights.chain1,
    candidate.weights.chain2,
    candidate.weights.chain3,
  ];
}

// 把基因数组还原成 Candidate，并强制 w1 <= w2 <= w3，且落在 [0, 1000]
export function unflatten_weights(values: number[], name: string): Candidate {
  const sorted = [values[0], values[1], values[2]]
    .map((v) => _clamp(v, 0, 1000))
    .sort((a, b) => a - b);

  return {
    name,
    weights: {
      chain1: _round(sorted[0]),
      chain2: _round(sorted[1]),
      chain3: _round(sorted[2]),
    },
  };
}

function _clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function _round(value: number): number {
  return Math.round(value * 1000) / 1000;
}

// 锦标赛选择：随机挑 tournament_size 个，返回 Elo 最高的那个
export function tournament_select(
  candidates: Candidate[],
  records: Map<string, CandidateRecord>,
  tournament_size: number,
  random: () => number,
): Candidate {
  let best: Candidate | null = null;
  let best_elo = -Infinity;

  for (let i = 0; i < tournament_size; i++) {
    const candidate = candidates[Math.floor(random() * candidates.length)];
    const record = records.get(candidate.name);
    const elo = record?.elo ?? -Infinity;

    if (elo > best_elo) {
      best_elo = elo;
      best = candidate;
    }
  }

  if (!best) throw new Error('tournament_select failed');
  return best;
}

// 均匀交叉：每个基因随机从 parent_a 或 parent_b 取
export function crossover(parent_a: Candidate, parent_b: Candidate, random: () => number): Candidate {
  const a_genes = flatten_weights(parent_a);
  const b_genes = flatten_weights(parent_b);
  const child_genes = a_genes.map((a, index) =>
    random() < 0.5 ? a : b_genes[index],
  );

  return unflatten_weights(child_genes, `${parent_a.name}x${parent_b.name}`);
}

// 变异：每个基因以 mutation_rate 的概率扰动 [-strength, +strength]
// 最后会重新排序并限制在 [0, 1000] 内
export function mutate(
  candidate: Candidate,
  mutation_rate: number,
  mutation_strength: number,
  random: () => number,
): Candidate {
  const genes = flatten_weights(candidate);
  const mutated = genes.map((value) => {
    if (random() >= mutation_rate) return value;
    return value + (random() * 2 - 1) * mutation_strength;
  });

  return unflatten_weights(mutated, candidate.name);
}
