import type { WhichPlayer } from '../algo/types';
import type { Connect4ChainWeights } from '../games/connect4';

export interface Candidate {
  name: string;
  self: Connect4ChainWeights;
  opponent: Connect4ChainWeights;
}

export interface CandidateRecord {
  elo: number;
  games: number;
  wins: number;
  losses: number;
  draws: number;
  points: number;
  total_moves: number;
}

export interface GameResult {
  red: string;
  yellow: string;
  winner: string | 'Draw';
  winner_player: WhichPlayer | 'Draw';
  moves: number;
}

export interface MatchJob {
  red: Candidate;
  yellow: Candidate;
  seed: number;
}
