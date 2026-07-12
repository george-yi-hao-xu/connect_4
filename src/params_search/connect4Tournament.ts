import { create_AI_player } from '../algo/aiPlayer';
import { connect4, type Connect4Move, type Connect4State, } from '../games/connect4';
import { create_candidate_game } from './connect4Candidates';
import type { Candidate, CandidateRecord, GameResult, MatchJob, } from './connect4Search.types';
import { gen_seed } from './randomUtils';

function is_legal_move(state: Connect4State, move: Connect4Move): boolean {
  return connect4.get_legal_moves(state).some((legal_move) => legal_move.col === move.col);
}

export async function play_silent_game(
  red_candidate: Candidate,
  yellow_candidate: Candidate,
  seed: number,
  depth: number,
  dims: string,
): Promise<GameResult> {
  const red_ai = create_AI_player( create_candidate_game(red_candidate, 'P1'), red_candidate.name, 0, gen_seed(seed), depth,);
  const yellow_ai = create_AI_player( create_candidate_game(yellow_candidate, 'P2'), yellow_candidate.name, 0, gen_seed(seed + 1), depth,);

  let state = connect4.init(dims);
  const max_possible_moves = state.matrix.length * state.matrix[0].length;
  let moves = 0;

  while (true) {
    const status = connect4.get_game_status(state);

    if (status.tag === 'Draw') {
      return { red: red_candidate.name, yellow: yellow_candidate.name, winner: 'Draw', winner_player: 'Draw', moves, };
    }

    if (status.tag === 'Win') {
      return { red: red_candidate.name, yellow: yellow_candidate.name,
        winner: status.player === 'P1' ? red_candidate.name : yellow_candidate.name, winner_player: status.player, moves, };
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

export function create_records(candidates: Candidate[], initial_elo: number): Map<string, CandidateRecord> {
  return new Map(
    candidates.map((candidate) => [
      candidate.name,
      { elo: initial_elo, games: 0, wins: 0, losses: 0, draws: 0,
        points: 0, total_moves: 0,
      },
    ]),
  );
}

function update_elo( a: CandidateRecord, b: CandidateRecord, actual_a: number, elo_k: number,): void {
  const expected_a = 1 / (1 + 10 ** ((b.elo - a.elo) / 400));
  const expected_b = 1 - expected_a;
  const actual_b = 1 - actual_a;

  a.elo += elo_k * (actual_a - expected_a);
  b.elo += elo_k * (actual_b - expected_b);
}

export function record_result( records: Map<string, CandidateRecord>, result: GameResult, elo_k: number,): void {
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

export function create_match_jobs(candidates: Candidate[], games_per_pair: number, seed: number): MatchJob[] {
  const jobs: MatchJob[] = [];

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

export function format_candidate(candidate: Candidate, record: CandidateRecord): string {
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
    `self=${JSON.stringify(candidate.self)}`,
    `opponent=${JSON.stringify(candidate.opponent)}`,
  ].join(' ');
}
