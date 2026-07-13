import { write_bench_log } from '../../bench/benchUtils';
import { gen_seed, shuffle } from '../randomUtils';
import { crossover, mutate, tournament_select } from './genetic';
import type { Candidate, CandidateRecord, SearchAdapter } from './types';
import {
  create_match_jobs,
  create_records,
  format_candidate,
  play_silent_game,
} from './tournament';
import { run_jobs_with_workers } from './worker';

export interface GeneticSearchOptions<TWeights> {
  adapter: SearchAdapter<TWeights>;
  population_size: number;
  generations: number;
  games_per_pair: number;
  depth: number;
  dims: string;
  seed: number;
  crossover_rate: number;
  mutation_rate: number;
  mutation_strength: number;
  elite_count: number;
  tournament_size: number;
  log_prefix: string;
  game_name: string;
  worker_script_path: string;
  elo_k: number;
  initial_elo: number;
}

function format_duration(ms: number): string {
  const seconds = Math.floor(ms / 1000) % 60;
  const minutes = Math.floor(ms / 1000 / 60) % 60;
  const hours = Math.floor(ms / 1000 / 60 / 60);
  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  parts.push(`${seconds}s`);
  return parts.join(' ');
}

export function create_candidates<TWeights>(
  adapter: SearchAdapter<TWeights>,
  count: number,
  seed: number,
): Candidate<TWeights>[] {
  const random = gen_seed(seed);

  return Array.from({ length: count }, (_, index) => ({
    name: `w${String(index + 1).padStart(3, '0')}`,
    weights: adapter.random_weights(random),
  }));
}

async function evaluate_population<TWeights>(
  adapter: SearchAdapter<TWeights>,
  population: Candidate<TWeights>[],
  games_per_pair: number,
  depth: number,
  dims: string,
  seed: number,
  game_name: string,
  worker_script_path: string,
  elo_k: number,
  initial_elo: number,
  stats?: { worker_count?: number },
): Promise<Map<string, CandidateRecord>> {
  const records = create_records(population, initial_elo);
  const jobs = shuffle(
    create_match_jobs(population, games_per_pair, seed),
    gen_seed(seed + 1),
  );

  if (jobs.length > 0) {
    const worker_count = await run_jobs_with_workers(
      jobs,
      records,
      depth,
      dims,
      game_name,
      worker_script_path,
      elo_k,
    );
    if (stats) stats.worker_count = worker_count;
    process.stdout.write('\n');
  }

  return records;
}

function rank_population<TWeights>(
  population: Candidate<TWeights>[],
  records: Map<string, CandidateRecord>,
): Candidate<TWeights>[] {
  return [...population].sort((a, b) => {
    const a_record = records.get(a.name);
    const b_record = records.get(b.name);
    if (!a_record || !b_record) throw new Error('missing candidate record');
    return b_record.elo - a_record.elo;
  });
}

function create_next_generation<TWeights>(
  adapter: SearchAdapter<TWeights>,
  ranked: Candidate<TWeights>[],
  records: Map<string, CandidateRecord>,
  generation: number,
  params: GeneticSearchOptions<TWeights>,
  seed: number,
): Candidate<TWeights>[] {
  const next: Candidate<TWeights>[] = [];
  const random = gen_seed(seed + generation * 1000);

  for (let i = 0; i < params.elite_count && i < ranked.length; i++) {
    next.push(ranked[i]);
  }

  while (next.length < params.population_size) {
    const parent_a = tournament_select(
      ranked,
      records,
      params.tournament_size,
      random,
    );
    const parent_b = tournament_select(
      ranked,
      records,
      params.tournament_size,
      random,
    );

    let child: Candidate<TWeights>;
    if (random() < params.crossover_rate) {
      child = crossover(adapter, parent_a, parent_b, random);
    } else {
      child = tournament_select([parent_a, parent_b], records, 2, random);
    }

    child = mutate(adapter, child, params.mutation_rate, params.mutation_strength, random);
    child.name = `g${generation}w${String(next.length + 1).padStart(3, '0')}`;
    next.push(child);
  }

  return next;
}

export async function run_genetic_search<TWeights>(
  options: GeneticSearchOptions<TWeights>,
): Promise<void> {
  const { adapter } = options;
  let population = create_candidates(adapter, options.population_size, options.seed);
  let best_ever: { candidate: Candidate<TWeights>; record: CandidateRecord } | null = null;

  console.log('Starting Training...');
  const start_time = Date.now();
  const stats = { worker_count: 0 };

  const lines: string[] = [
    `${options.game_name} genetic weight search, population=${options.population_size} generations=${options.generations} gamesPerPair=${options.games_per_pair} depth=${options.depth} dims="${options.dims}"`,
    `crossover_rate=${options.crossover_rate} mutation_rate=${options.mutation_rate} mutation_strength=${options.mutation_strength} elite_count=${options.elite_count} tournament_size=${options.tournament_size}`,
    `seed=${options.seed}`,
    `elo_k=${options.elo_k}`,
    `timestamp=${new Date().toISOString()}`,
    '',
  ];

  for (let generation = 0; generation < options.generations; generation++) {
    console.log(`Training generation ${generation + 1}/${options.generations}...`);
    const records = await evaluate_population(
      adapter,
      population,
      options.games_per_pair,
      options.depth,
      options.dims,
      options.seed + generation,
      options.game_name,
      options.worker_script_path,
      options.elo_k,
      options.initial_elo,
      stats,
    );
    const ranked = rank_population(population, records);

    const top_candidate = ranked[0];
    const top_record = records.get(top_candidate.name)!;
    if (!best_ever || top_record.elo > best_ever.record.elo) {
      best_ever = { candidate: top_candidate, record: top_record };
    }

    lines.push(
      `Generation ${generation + 1}/${options.generations}: top elo=${top_record.elo.toFixed(0)}`,
    );

    if (generation < options.generations - 1) {
      population = create_next_generation(
        adapter,
        ranked,
        records,
        generation + 1,
        options,
        options.seed,
      );
    }
  }

  lines.push(`workers=${stats.worker_count}`);

  const final_records = await evaluate_population(
    adapter,
    population,
    options.games_per_pair,
    options.depth,
    options.dims,
    options.seed + options.generations,
    options.game_name,
    options.worker_script_path,
    options.elo_k,
    options.initial_elo,
    stats,
  );
  const final_ranked = rank_population(population, final_records);

  lines.push('', 'Top candidates (final generation):');
  for (const candidate of final_ranked.slice(0, 5)) {
    const record = final_records.get(candidate.name)!;
    lines.push(`  ${format_candidate(adapter, candidate, record)}`);
  }

  if (best_ever) {
    lines.push('', 'Best candidate ever seen:');
    lines.push(`  ${format_candidate(adapter, best_ever.candidate, best_ever.record)}`);
  }

  const elapsed_ms = Date.now() - start_time;
  const elapsed_str = format_duration(elapsed_ms);
  lines.push('', `total_time=${elapsed_str}`);

  const log_path = write_bench_log(options.log_prefix, lines);
  console.log([...lines, '', `log=${log_path}`].join('\n'));
}
