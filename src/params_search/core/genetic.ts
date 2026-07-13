import type { Candidate, CandidateRecord, SearchAdapter } from './types';

export function tournament_select<TWeights>(
  candidates: Candidate<TWeights>[],
  records: Map<string, CandidateRecord>,
  tournament_size: number,
  random: () => number,
): Candidate<TWeights> {
  let best: Candidate<TWeights> | null = null;
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

export function crossover<TWeights>(
  adapter: SearchAdapter<TWeights>,
  parent_a: Candidate<TWeights>,
  parent_b: Candidate<TWeights>,
  random: () => number,
): Candidate<TWeights> {
  const a_genes = adapter.flatten(parent_a.weights);
  const b_genes = adapter.flatten(parent_b.weights);
  const child_genes = a_genes.map((a, index) =>
    random() < 0.5 ? a : b_genes[index],
  );

  return {
    name: `${parent_a.name}x${parent_b.name}`,
    weights: adapter.unflatten(child_genes),
  };
}

export function mutate<TWeights>(
  adapter: SearchAdapter<TWeights>,
  candidate: Candidate<TWeights>,
  mutation_rate: number,
  mutation_strength: number,
  random: () => number,
): Candidate<TWeights> {
  const genes = adapter.flatten(candidate.weights);
  const mutated = genes.map((value) => {
    if (random() >= mutation_rate) return value;
    return value + (random() * 2 - 1) * mutation_strength;
  });

  return {
    name: candidate.name,
    weights: adapter.unflatten(mutated),
  };
}
