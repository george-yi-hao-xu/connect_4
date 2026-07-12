import { write_bench_log } from '../bench/benchUtils';
import { create_candidates } from './connect4Candidates';
import {
  create_match_jobs,
  create_records,
  format_candidate,
  play_silent_game,
  record_result,
} from './connect4Tournament';
import { crossover, mutate, tournament_select } from './connect4Genetic';
import { gen_seed, shuffle } from './randomUtils';
import type { Candidate, CandidateRecord } from './connect4Search.types';

const DEFAULT_POPULATION = 12;
const DEFAULT_GENERATIONS = 5;
const DEFAULT_GAMES_PER_PAIR = 2;
const DEFAULT_DEPTH = 3;
const DEFAULT_BOARD_HEIGHT = 5;
const DEFAULT_BOARD_WIDTH = 6;
const DEFAULT_SEED = 20260712;
const INITIAL_ELO = 1000;
const ELO_K = 32;

// GA 默认超参数
const DEFAULT_CROSSOVER_RATE = 0.8;
const DEFAULT_MUTATION_RATE = 0.2;
const DEFAULT_MUTATION_STRENGTH = 100;
const DEFAULT_ELITE_COUNT = 2;
const DEFAULT_TOURNAMENT_SIZE = 3;

interface GaParams {
  population_size: number;
  generations: number;
  games_per_pair: number;
  depth: number;
  dims: string;
  crossover_rate: number;
  mutation_rate: number;
  mutation_strength: number;
  elite_count: number;
  tournament_size: number;
}

// CLI 参数顺序：
//   population generations gamesPerPair depth boardHeight boardWidth crossoverRate mutationRate mutationStrength eliteCount tournamentSize
// 例子：npm run search:connect4 -- 16 10 2 3 5 6 0.8 0.2 100 2 3
function parse_args(): GaParams {
  const population_size = Number(process.argv[2] ?? DEFAULT_POPULATION);
  const generations = Number(process.argv[3] ?? DEFAULT_GENERATIONS);
  const games_per_pair = Number(process.argv[4] ?? DEFAULT_GAMES_PER_PAIR);
  const depth = Number(process.argv[5] ?? DEFAULT_DEPTH);
  const board_height = Number(process.argv[6] ?? DEFAULT_BOARD_HEIGHT);
  const board_width = Number(process.argv[7] ?? DEFAULT_BOARD_WIDTH);
  const crossover_rate = Number(process.argv[8] ?? DEFAULT_CROSSOVER_RATE);
  const mutation_rate = Number(process.argv[9] ?? DEFAULT_MUTATION_RATE);
  const mutation_strength = Number(process.argv[10] ?? DEFAULT_MUTATION_STRENGTH);
  const elite_count = Number(process.argv[11] ?? DEFAULT_ELITE_COUNT);
  const tournament_size = Number(process.argv[12] ?? DEFAULT_TOURNAMENT_SIZE);

  return {
    population_size,
    generations,
    games_per_pair,
    depth,
    dims: `${board_height} ${board_width}`,
    crossover_rate,
    mutation_rate,
    mutation_strength,
    elite_count,
    tournament_size,
  };
}

// 让种群两两对战，返回每个人的 Elo 记录
async function evaluate_population(
  population: Candidate[],
  games_per_pair: number,
  depth: number,
  dims: string,
  seed: number,
): Promise<Map<string, CandidateRecord>> {
  const records = create_records(population, INITIAL_ELO);
  const jobs = shuffle(
    create_match_jobs(population, games_per_pair, seed),
    gen_seed(seed + 1),
  );

  for (const job of jobs) {
    const result = await play_silent_game(job.red, job.yellow, job.seed, depth, dims);
    record_result(records, result, ELO_K);
  }

  return records;
}

// 按 Elo 从高到低排序
function rank_population(
  population: Candidate[],
  records: Map<string, CandidateRecord>,
): Candidate[] {
  return [...population].sort((a, b) => {
    const a_record = records.get(a.name);
    const b_record = records.get(b.name);
    if (!a_record || !b_record) throw new Error('missing candidate record');
    return b_record.elo - a_record.elo;
  });
}

// 根据上一代生成下一代：保留精英 + 选择/交叉/变异
function create_next_generation(
  ranked: Candidate[],
  records: Map<string, CandidateRecord>,
  generation: number,
  params: GaParams,
  seed: number,
): Candidate[] {
  const next: Candidate[] = [];
  const random = gen_seed(seed + generation * 1000);

  // 精英保留：直接复制上一代前几名
  for (let i = 0; i < params.elite_count && i < ranked.length; i++) {
    next.push(ranked[i]);
  }

  // 用选择 + 交叉 + 变异填满种群
  while (next.length < params.population_size) {
    const parent_a = tournament_select(ranked, records, params.tournament_size, random);
    const parent_b = tournament_select(ranked, records, params.tournament_size, random);

    let child: Candidate;
    if (random() < params.crossover_rate) {
      child = crossover(parent_a, parent_b, random);
    } else {
      // 不交叉时，直接复制父母中较强的一个
      child = tournament_select([parent_a, parent_b], records, 2, random);
    }

    child = mutate(child, params.mutation_rate, params.mutation_strength, random);
    child.name = `g${generation}w${String(next.length + 1).padStart(3, '0')}`;
    next.push(child);
  }

  return next;
}

async function main(): Promise<void> {
  const params = parse_args();
  let population = create_candidates(params.population_size, DEFAULT_SEED);
  let best_ever: { candidate: Candidate; record: CandidateRecord } | null = null;

  const lines: string[] = [
    `Connect4 genetic weight search, population=${params.population_size} generations=${params.generations} gamesPerPair=${params.games_per_pair} depth=${params.depth} dims="${params.dims}"`,
    `crossover_rate=${params.crossover_rate} mutation_rate=${params.mutation_rate} mutation_strength=${params.mutation_strength} elite_count=${params.elite_count} tournament_size=${params.tournament_size}`,
    `seed=${DEFAULT_SEED}`,
    `elo_k=${ELO_K}`,
    `timestamp=${new Date().toISOString()}`,
    '',
  ];

  for (let generation = 0; generation < params.generations; generation++) {
    const records = await evaluate_population(
      population,
      params.games_per_pair,
      params.depth,
      params.dims,
      DEFAULT_SEED + generation,
    );
    const ranked = rank_population(population, records);

    const top_candidate = ranked[0];
    const top_record = records.get(top_candidate.name)!;
    if (!best_ever || top_record.elo > best_ever.record.elo) {
      best_ever = { candidate: top_candidate, record: top_record };
    }

    lines.push(
      `Generation ${generation + 1}/${params.generations}: top elo=${top_record.elo.toFixed(0)}`,
    );

    if (generation < params.generations - 1) {
      population = create_next_generation( ranked, records, generation + 1, params, DEFAULT_SEED,);
    }
  }

  // 最后再完整评估一次最终种群，输出排名
  const final_records = await evaluate_population(
    population,
    params.games_per_pair,
    params.depth,
    params.dims,
    DEFAULT_SEED + params.generations,
  );
  const final_ranked = rank_population(population, final_records);

  lines.push('', 'Top candidates (final generation):');
  for (const candidate of final_ranked.slice(0, 5)) {
    const record = final_records.get(candidate.name)!;
    lines.push(`  ${format_candidate(candidate, record)}`);
  }

  if (best_ever) {
    lines.push('', 'Best candidate ever seen:');
    lines.push(`  ${format_candidate(best_ever.candidate, best_ever.record)}`);
  }

  const log_path = write_bench_log('connect4-genetic-search', lines);
  console.log([...lines, '', `log=${log_path}`].join('\n'));
}

void main();
