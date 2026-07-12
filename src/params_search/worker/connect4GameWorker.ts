import { parentPort } from 'node:worker_threads';
import { play_silent_game } from '../connect4Tournament';
import type { GameResult, MatchJob } from '../connect4Search.types';

interface RunJobMessage {
  type: 'run';
  job: MatchJob;
  depth: number;
  dims: string;
}

if (!parentPort) {
  throw new Error('connect4GameWorker must be run as a worker thread');
}

parentPort.on('message', async (message: RunJobMessage) => {
  if (message.type !== 'run') return;

  const { job, depth, dims } = message;
  const result = await play_silent_game(job.red, job.yellow, job.seed, depth, dims);

  parentPort!.postMessage({ type: 'result', result });
});
