import { create_AI_player } from '../algo/aiPlayer';
import type { WhichPlayer } from '../algo/types';
import {
  connect4,
  create_connect4,
  type Connect4ChainWeights,
  type Connect4Move,
  type Connect4State,
} from '../games/connect4';
import { write_bench_log } from './benchUtils';

interface Case {
  name: string;
  self: Connect4ChainWeights;
  opponent: Connect4ChainWeights;
}

interface GameResult {
  red: string;
  yellow: string;
  winner: string | 'Draw';
  winner_player: WhichPlayer | 'Draw';
  moves: number;
}

interface StrategyRecord {
  games: number;
  wins: number;
  losses: number;
  draws: number;
  red_games: number;
  yellow_games: number;
  total_moves: number;
}

const DEFAULT_DIMS = '5 6';
const DEFAULT_DEPTH = 3;
const DEFAULT_RUNS = 1;

const CASES: Case[] = [
  {
    name: 'balanced',
    self: { chain3: 1.00, chain2: 0.50, chain1: 0.25 },
    opponent: { chain3: 1.00, chain2: 0.50, chain1: 0.25 },
  },
  {
    name: 'aggressive',
    self: { chain3: 3.00, chain2: 0.80, chain1: 0.10 },
    opponent: { chain3: 0.80, chain2: 0.30, chain1: 0.05 },
  },
  {
    name: 'defensive',
    self: { chain3: 1.00, chain2: 0.45, chain1: 0.10 },
    opponent: { chain3: 3.00, chain2: 1.20, chain1: 0.20 },
  },
  {
    name: 'builder',
    self: { chain3: 1.80, chain2: 1.00, chain1: 0.35 },
    opponent: { chain3: 1.50, chain2: 0.75, chain1: 0.15 },
  },
];

function create_seeded_random(seed: number): () => number {
  let state = seed >>> 0;

  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function create_strategy_game(strategy: Case, player: WhichPlayer) {
  return player === 'P1'
    ? create_connect4({ red: strategy.self, yellow: strategy.opponent })
    : create_connect4({ red: strategy.opponent, yellow: strategy.self });
}

function is_legal_move(state: Connect4State, move: Connect4Move): boolean {
  return connect4.get_legal_moves(state).some((legal_move) => legal_move.col === move.col);
}

async function run_silent(red_strategy: Case, yellow_strategy: Case, seed: number, depth: number, dims: string): Promise<GameResult> {
  const red_ai = create_AI_player(
    create_strategy_game(red_strategy, 'P1'),
    red_strategy.name,
    0,
    create_seeded_random(seed),
    depth,
  );

  const yellow_ai = create_AI_player(
    create_strategy_game(yellow_strategy, 'P2'),
    yellow_strategy.name,
    0,
    create_seeded_random(seed + 1),
    depth,
  );

  let state = connect4.init(dims);
  const max_possible_moves = state.matrix.length * state.matrix[0].length;
  let moves = 0;

  while (true) {
    const status = connect4.get_game_status(state);

    if (status.tag === 'Draw') {
      return {
        red: red_strategy.name,
        yellow: yellow_strategy.name,
        winner: 'Draw',
        winner_player: 'Draw',
        moves,
      };
    }

    if (status.tag === 'Win') {
      return {
        red: red_strategy.name,
        yellow: yellow_strategy.name,
        winner: status.player === 'P1' ? red_strategy.name : yellow_strategy.name,
        winner_player: status.player,
        moves,
      };
    }

    if (moves >= max_possible_moves) {
      throw new Error(`game exceeded ${max_possible_moves} moves`);
    }

    const current_ai = status.player === 'P1' ? red_ai : yellow_ai;
    const move = await current_ai.get_next_move(state);
    if (!is_legal_move(state, move)) {
      throw new Error(`${current_ai.player_name} made an illegal move: ${connect4.str_move(move)}`);
    }

    state = connect4.get_next_state(state, move);
    moves++;
  }
}

function create_records(cases: Case[]): Map<string, StrategyRecord> {
  return new Map(
    cases.map((strategy) => [
      strategy.name,
      { games: 0, wins: 0, losses: 0, draws: 0, red_games: 0, yellow_games: 0, total_moves: 0, },
    ]),
  );
}

function record_result(records: Map<string, StrategyRecord>, result: GameResult): void {
  const red_record = records.get(result.red);
  const yellow_record = records.get(result.yellow);
  if (!red_record || !yellow_record) throw new Error('missing strategy record');

  red_record.games++;
  red_record.red_games++;
  red_record.total_moves += result.moves;

  yellow_record.games++;
  yellow_record.yellow_games++;
  yellow_record.total_moves += result.moves;

  if (result.winner === 'Draw') {
    red_record.draws++;
    yellow_record.draws++;
    return;
  }

  const winner_record = records.get(result.winner);
  const loser_record = records.get(result.winner === result.red ? result.yellow : result.red);
  if (!winner_record || !loser_record) throw new Error('missing winner or loser record');

  winner_record.wins++;
  loser_record.losses++;
}

function format_record(name: string, record: StrategyRecord): string {
  const win_rate = record.games === 0 ? 0 : (record.wins / record.games) * 100;
  const avg_moves = record.games === 0 ? 0 : record.total_moves / record.games;

  return [
    name.padEnd(12),
    `games=${record.games}`,
    `wins=${record.wins}`,
    `losses=${record.losses}`,
    `draws=${record.draws}`,
    `win_rate=${win_rate.toFixed(1)}%`,
    `avg_moves=${avg_moves.toFixed(1)}`,
    `red=${record.red_games}`,
    `yellow=${record.yellow_games}`,
  ].join(' ');
}

async function main(): Promise<void> {
  // CLI args: runs depth boardHeight boardWidth
  // Example: npm run bench:connect4 -- 3 4 6 7
  // Defaults: runs=1, depth=3, dims="5 6"
  const runs = Number(process.argv[2] ?? DEFAULT_RUNS);
  const depth = Number(process.argv[3] ?? DEFAULT_DEPTH);
  const dims = process.argv.slice(4).join(' ') || DEFAULT_DIMS;
  const records = create_records(CASES);
  const lines: string[] = [
    `Connect4 parameter benchmark, runs=${runs} depth=${depth} dims="${dims}"`,
    `timestamp=${new Date().toISOString()}`,
    '',
    'Strategies:',
    ...CASES.map(
      (strategy) =>
        `  ${strategy.name}: self=${JSON.stringify(strategy.self)} opponent=${JSON.stringify(strategy.opponent)}`,
    ),
    '',
    'Games:',
  ];

  for (let i = 0; i < CASES.length; i++) {
    for (let j = i + 1; j < CASES.length; j++) {
      for (let run = 0; run < runs; run++) {
        const seed = 1000 + i * 100 + j * 10 + run;
        const first = await run_silent(CASES[i], CASES[j], seed, depth, dims);
        const second = await run_silent(CASES[j], CASES[i], seed + 5000, depth, dims);

        record_result(records, first);
        record_result(records, second);

        lines.push(
          `  ${first.red} red vs ${first.yellow} yellow: ${first.winner_player} ${first.winner} in ${first.moves} moves`,
          `  ${second.red} red vs ${second.yellow} yellow: ${second.winner_player} ${second.winner} in ${second.moves} moves`,
        );
      }
    }
  }

  lines.push('', 'Summary:');
  for (const strategy of CASES) {
    const record = records.get(strategy.name);
    if (!record) throw new Error('missing strategy record');
    lines.push(`  ${format_record(strategy.name, record)}`);
  }

  const log_path = write_bench_log('connect4-param-ai', lines);
  const output = [...lines, ``, `log=${log_path}`].join('\n');
  console.log(output);
}

void main();
