import { write_bench_log } from '../bench/benchUtils';
import { create_candidates } from './connect4Candidates';
import {
  create_match_jobs,
  create_records,
  format_candidate,
  play_silent_game,
  record_result,
} from './connect4Tournament';
import { gen_seed, shuffle } from './randomUtils';

const DEFAULT_CANDIDATES = 12;
const DEFAULT_GAMES_PER_PAIR = 2;
const DEFAULT_DEPTH = 3;
const DEFAULT_DIMS = '5 6';
const DEFAULT_SEED = 20260712;
const INITIAL_ELO = 1000;
const ELO_K = 32;

async function main(): Promise<void> {
  // CLI args: candidates gamesPerPair depth boardHeight boardWidth
  // Example: npm run search:connect4 -- 20 2 3 6 7
  // Defaults: candidates=12, gamesPerPair=2, depth=3, dims="5 6"
  const candidate_count = Number(process.argv[2] ?? DEFAULT_CANDIDATES);
  const games_per_pair = Number(process.argv[3] ?? DEFAULT_GAMES_PER_PAIR);
  const depth = Number(process.argv[4] ?? DEFAULT_DEPTH);
  const dims = process.argv.slice(5).join(' ') || DEFAULT_DIMS;

  const candidates = create_candidates(candidate_count, DEFAULT_SEED);
  const records = create_records(candidates, INITIAL_ELO);
  const jobs = shuffle(
    create_match_jobs(candidates, games_per_pair, DEFAULT_SEED),
    gen_seed(DEFAULT_SEED + 1),
  );
  const lines: string[] = [
    `Connect4 random weight search, candidates=${candidate_count} gamesPerPair=${games_per_pair} depth=${depth} dims="${dims}"`,
    `seed=${DEFAULT_SEED}`,
    `games=${jobs.length}`,
    `timestamp=${new Date().toISOString()}`,
    '',
  ];

  for (const job of jobs) {
    const result = await play_silent_game(job.red, job.yellow, job.seed, depth, dims);
    record_result(records, result, ELO_K);
  }

  const ranked = [...candidates].sort((a, b) => {
    const a_record = records.get(a.name);
    const b_record = records.get(b.name);
    if (!a_record || !b_record) throw new Error('missing candidate record');
    return b_record.elo - a_record.elo;
  });

  lines.push('Top candidates:');
  for (const candidate of ranked.slice(0, 10)) {
    const record = records.get(candidate.name);
    if (!record) throw new Error('missing candidate record');
    lines.push(`  ${format_candidate(candidate, record)}`);
  }

  lines.push('', 'All candidates:');
  for (const candidate of ranked) {
    const record = records.get(candidate.name);
    if (!record) throw new Error('missing candidate record');
    lines.push(`  ${format_candidate(candidate, record)}`);
  }

  const log_path = write_bench_log('connect4-weight-search', lines);
  console.log([...lines, '', `log=${log_path}`].join('\n'));
}

void main();
