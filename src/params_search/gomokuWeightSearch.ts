import * as path from 'node:path';
import type { GomokuScoreWeights } from '../games/gomoku';
import { gomoku_adapter } from './adapters/gomokuAdapter';
import { run_genetic_search, type GeneticSearchOptions } from './core/search';

const DEFAULT_POPULATION = 20;
const EPOCHS = 5;

const DEFAULT_GAMES_PER_PAIR = 2;
const DEFAULT_DEPTH = 2;
const DEFAULT_BOARD_HEIGHT = 15;
const DEFAULT_BOARD_WIDTH = 15;
const DEFAULT_SEED = 20260712;
const INITIAL_ELO = 1000;
const ELO_K = 32;

const DEFAULT_CROSSOVER_RATE = 0.8;
const DEFAULT_MUTATION_RATE = 0.2;
const DEFAULT_MUTATION_STRENGTH = 50;
const DEFAULT_ELITE_COUNT = 2;
const DEFAULT_TOURNAMENT_SIZE = 3;

// CLI args:
//   population generations gamesPerPair depth boardHeight boardWidth crossoverRate mutationRate mutationStrength eliteCount tournamentSize
// Example:
//   npm run search:gomoku -- 16 10 1 2 15 15 0.8 0.2 100 2 3
function parse_args(): GeneticSearchOptions<GomokuScoreWeights> {
  const population_size = Number(process.argv[2] ?? DEFAULT_POPULATION);
  const generations = Number(process.argv[3] ?? EPOCHS);
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
    adapter: gomoku_adapter,
    population_size,
    generations,
    games_per_pair,
    depth,
    dims: `${board_height} ${board_width}`,
    seed: DEFAULT_SEED,
    crossover_rate,
    mutation_rate,
    mutation_strength,
    elite_count,
    tournament_size,
    log_prefix: 'gomoku-genetic-search',
    game_name: 'gomoku',
    worker_script_path: path.join(__dirname, 'worker', 'gomokuGameWorker.js'),
    elo_k: ELO_K,
    initial_elo: INITIAL_ELO,
  };
}

async function main(): Promise<void> {
  const options = parse_args();
  await run_genetic_search(options);
}

void main();
