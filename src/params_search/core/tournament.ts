import { create_AI_player } from '../../algo/aiPlayer';
import type { Game, WhichPlayer } from '../../algo/types';
import { gen_seed } from '../randomUtils';
import type {
  Candidate,
  CandidateRecord,
  GameResult,
  MatchJob,
  SearchAdapter,
} from './types';

function is_legal_move<S, M>(
  game: Game<S, M>,
  state: S,
  move: M,
): boolean {
  const move_str = JSON.stringify(move);
  return game.get_legal_moves(state).some((m) => JSON.stringify(m) === move_str);
}

export async function play_silent_game<TWeights>(
  adapter: SearchAdapter<TWeights>,
  red_candidate: Candidate<TWeights>,
  yellow_candidate: Candidate<TWeights>,
  seed: number,
  depth: number,
  dims: string,
): Promise<GameResult> {
  const red_ai = create_AI_player(
    adapter.create_game(red_candidate.weights, 'P1') as Game<unknown, unknown>,
    red_candidate.name,
    0,
    gen_seed(seed),
    depth,
  );
  const yellow_ai = create_AI_player(
    adapter.create_game(yellow_candidate.weights, 'P2') as Game<unknown, unknown>,
    yellow_candidate.name,
    0,
    gen_seed(seed + 1),
    depth,
  );

  // State transitions are independent of score weights; either game ref works.
  const game = red_ai.game_ref;
  let state = game.init(dims);
  // Both Connect4 and Gomoku expose state.matrix; use its total cell count as
  // a safe upper bound to detect runaway games without game-specific knowledge.
  const matrix = (state as { matrix: unknown[][] }).matrix;
  const max_possible_moves = matrix.length * (matrix[0]?.length ?? 0) + 1;
  let moves = 0;

  while (true) {
    const status = game.get_game_status(state);

    if (status.tag === 'Draw') {
      return {
        red: red_candidate.name,
        yellow: yellow_candidate.name,
        winner: 'Draw',
        winner_player: 'Draw',
        moves,
      };
    }

    if (status.tag === 'Win') {
      return {
        red: red_candidate.name,
        yellow: yellow_candidate.name,
        winner: status.player === 'P1' ? red_candidate.name : yellow_candidate.name,
        winner_player: status.player,
        moves,
      };
    }

    if (moves >= max_possible_moves) {
      throw new Error(`game exceeded ${max_possible_moves} moves`);
    }

    const current_ai = status.player === 'P1' ? red_ai : yellow_ai;
    const move = await current_ai.get_next_move(state);
    if (!is_legal_move(game, state, move)) {
      throw new Error(
        `${current_ai.player_name} made an illegal move: ${game.str_move(move)}`,
      );
    }

    state = game.get_next_state(state, move);
    moves++;
  }
}

export function create_records<TWeights>(
  candidates: Candidate<TWeights>[],
  initial_elo: number,
): Map<string, CandidateRecord> {
  return new Map(
    candidates.map((candidate) => [
      candidate.name,
      {
        elo: initial_elo,
        games: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        points: 0,
        total_moves: 0,
      },
    ]),
  );
}

function update_elo(
  a: CandidateRecord,
  b: CandidateRecord,
  actual_a: number,
  elo_k: number,
): void {
  const expected_a = 1 / (1 + 10 ** ((b.elo - a.elo) / 400));
  const expected_b = 1 - expected_a;
  const actual_b = 1 - actual_a;

  a.elo += elo_k * (actual_a - expected_a);
  b.elo += elo_k * (actual_b - expected_b);
}

export function record_result(
  records: Map<string, CandidateRecord>,
  result: GameResult,
  elo_k: number,
): void {
  const red_record = records.get(result.red);
  const yellow_record = records.get(result.yellow);
  if (!red_record || !yellow_record) throw new Error('missing candidate record');

  red_record.games++;
  yellow_record.games++;
  red_record.total_moves += result.moves;
  yellow_record.total_moves += result.moves;

  if (result.winner === 'Draw') {
    red_record.draws++;
    yellow_record.draws++;
    red_record.points += 0.5;
    yellow_record.points += 0.5;
    update_elo(red_record, yellow_record, 0.5, elo_k);
    return;
  }

  const red_won = result.winner === result.red;
  const winner_record = red_won ? red_record : yellow_record;
  const loser_record = red_won ? yellow_record : red_record;

  winner_record.wins++;
  loser_record.losses++;
  winner_record.points += 1;
  update_elo(red_record, yellow_record, red_won ? 1 : 0, elo_k);
}

export function create_match_jobs<TWeights>(
  candidates: Candidate<TWeights>[],
  games_per_pair: number,
  seed: number,
): MatchJob<TWeights>[] {
  const jobs: MatchJob<TWeights>[] = [];

  for (let i = 0; i < candidates.length; i++) {
    for (let j = i + 1; j < candidates.length; j++) {
      for (let game = 0; game < games_per_pair; game++) {
        const game_seed = seed + i * 100000 + j * 1000 + game * 10;
        jobs.push(
          { red: candidates[i], yellow: candidates[j], seed: game_seed },
          { red: candidates[j], yellow: candidates[i], seed: game_seed + 1 },
        );
      }
    }
  }

  return jobs;
}

export function format_candidate<TWeights>(
  adapter: SearchAdapter<TWeights>,
  candidate: Candidate<TWeights>,
  record: CandidateRecord,
): string {
  const win_rate = record.games === 0 ? 0 : (record.wins / record.games) * 100;
  const score_rate = record.games === 0 ? 0 : (record.points / record.games) * 100;
  const avg_moves = record.games === 0 ? 0 : record.total_moves / record.games;

  return [
    candidate.name,
    `elo=${record.elo.toFixed(0)}`,
    `score=${score_rate.toFixed(1)}%`,
    `wins=${record.wins}`,
    `losses=${record.losses}`,
    `draws=${record.draws}`,
    `win_rate=${win_rate.toFixed(1)}%`,
    `avg_moves=${avg_moves.toFixed(1)}`,
    `weights=${adapter.format_weights(candidate.weights)}`,
  ].join(' ');
}
