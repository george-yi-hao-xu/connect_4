import { create_AI_player } from '../algo/aiPlayer';
import { gomoku, type GomokuPlace, type GomokuState } from '../games/gomoku';
import type { WhichPlayer } from '../algo/types';
import {
  checker,
  format_summary,
  summarize,
  write_bench_log,
  type RunMetric,
} from './benchUtils';

type Coord = [row: number, col: number];

const GOMOKU_AI_DEPTH = 5;

interface BenchCase {
  name: string;
  player: WhichPlayer;
  whites: Coord[];
  blacks: Coord[];
}

function create_seeded_random(seed: number): () => number {
  let state = seed >>> 0;

  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function create_empty_board(): GomokuPlace[][] {
  return Array.from({ length: 15 }, () => Array<GomokuPlace>(15).fill('None'));
}

function create_state({ player, whites, blacks }: BenchCase): GomokuState {
  const matrix = create_empty_board();

  for (const [row, col] of whites) {
    matrix[row][col] = 'White';
  }

  for (const [row, col] of blacks) {
    matrix[row][col] = 'Black';
  }

  return {
    status: { tag: 'Ongoing', player },
    matrix,
  };
}

async function bench_case(test_case: BenchCase, runs: number): Promise<string[]> {
  const state = create_state(test_case);
  const player_name = test_case.player === 'P1' ? 'MAX' : 'MIN';

  await create_AI_player(gomoku, player_name, 0, create_seeded_random(17), GOMOKU_AI_DEPTH).get_next_move(state);

  const metrics: RunMetric[] = [];
  for (let i = 0; i < runs; i++) {
    const ai = create_AI_player(gomoku, player_name, 0, create_seeded_random(17), GOMOKU_AI_DEPTH);
    const result = await checker(`${test_case.name} run ${i + 1}`, () => ai.get_next_move(state));
    metrics.push(result.metric);
  }

  const wall = summarize(metrics.map((metric) => metric.wall_ms));
  const cpu = summarize(metrics.map((metric) => metric.cpu_ms));
  const heap = summarize(metrics.map((metric) => metric.heap_used_mb));
  const rss = summarize(metrics.map((metric) => metric.rss_mb));

  return [
    test_case.name,
    `  ${format_summary('wall', 'ms', wall)}`,
    `  ${format_summary('cpu', 'ms', cpu)}`,
    `  ${format_summary('heap_used', 'MB', heap)}`,
    `  ${format_summary('rss', 'MB', rss)}`,
  ];
}

async function main(): Promise<void> {
  const runs = Number(process.argv[2] ?? 10);
  const cases: BenchCase[] = [
    {
      name: 'white immediate win',
      player: 'P2',
      whites: [[7, 6], [7, 7], [7, 8], [7, 9]],
      blacks: [[6, 6], [6, 7], [6, 8], [8, 8]],
    },
    {
      name: 'white must block',
      player: 'P2',
      whites: [[6, 5], [7, 7], [8, 8], [9, 8]],
      blacks: [[6, 6], [6, 7], [6, 8], [6, 9]],
    },
    {
      name: 'balanced mid game',
      player: 'P2',
      whites: [[7, 7], [7, 8], [8, 8], [6, 9], [9, 8]],
      blacks: [[6, 7], [8, 7], [8, 9], [7, 9], [9, 9]],
    },
    {
      name: 'busy board',
      player: 'P1',
      whites: [[7, 7], [7, 8], [8, 8], [6, 9], [9, 8], [5, 6], [10, 9], [9, 6]],
      blacks: [[6, 7], [8, 7], [8, 9], [7, 9], [9, 9], [5, 7], [10, 8], [8, 6]],
    },
  ];

  const lines: string[] = [
    `Gomoku AI benchmark, runs=${runs}`,
    `timestamp=${new Date().toISOString()}`,
    '',
  ];

  for (const test_case of cases) {
    lines.push(...await bench_case(test_case, runs), '');
  }

  const log_path = write_bench_log('gomoku-ai', lines);
  lines.push(`log=${log_path}`);

  const output = lines.join('\n');
  console.log(output);
}

void main();
