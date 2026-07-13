import * as os from 'node:os';
import * as path from 'node:path';
import { parentPort, Worker } from 'node:worker_threads';
import { record_result } from './tournament';
import type {
  CandidateRecord,
  GameResult,
  MatchJob,
  SearchAdapter,
} from './types';

interface RunJobMessage<TWeights> {
  type: 'run';
  game_name: string;
  job: MatchJob<TWeights>;
  depth: number;
  dims: string;
}

export function run_jobs_with_workers<TWeights>(
  jobs: MatchJob<TWeights>[],
  records: Map<string, CandidateRecord>,
  depth: number,
  dims: string,
  game_name: string,
  worker_script_path: string,
  elo_k: number,
): Promise<number> {
  return new Promise((resolve, reject) => {
    const worker_count = Math.min(
      os.availableParallelism?.() ?? os.cpus().length,
      jobs.length,
    );
    const workers: Worker[] = [];
    let completed = 0;
    let job_index = 0;
    let has_error = false;

    function cleanup() {
      for (const worker of workers) {
        worker.terminate().catch(() => {});
      }
    }

    function send_next_job(worker: Worker) {
      if (job_index < jobs.length) {
        worker.postMessage({
          type: 'run',
          game_name,
          job: jobs[job_index],
          depth,
          dims,
        } as RunJobMessage<TWeights>);
        job_index++;
      }
    }

    for (let i = 0; i < worker_count; i++) {
      const worker = new Worker(worker_script_path);

      worker.on('message', (message) => {
        if (message.type === 'result') {
          const result = message.result as GameResult;
          record_result(records, result, elo_k);
          completed++;
          process.stdout.write(`\rCompleted ${completed}/${jobs.length} games`);
          send_next_job(worker);

          if (completed === jobs.length) {
            cleanup();
            resolve(worker_count);
          }
        }
      });

      worker.on('error', (err) => {
        if (!has_error) {
          has_error = true;
          cleanup();
          reject(err);
        }
      });

      worker.on('exit', (code) => {
        if (code !== 0 && !has_error) {
          has_error = true;
          cleanup();
          reject(new Error(`Worker stopped with exit code ${code}`));
        }
      });

      workers.push(worker);
      send_next_job(worker);
    }
  });
}

export function start_worker(
  adapters: Record<string, SearchAdapter<any>>,
): void {
  if (!parentPort) {
    throw new Error('worker must be run as a worker thread');
  }

  parentPort.on('message', async (message: RunJobMessage<any>) => {
    if (message.type !== 'run') return;

    const { game_name, job, depth, dims } = message;
    const adapter = adapters[game_name];
    if (!adapter) {
      throw new Error(`unknown game: ${game_name}`);
    }

    const { play_silent_game } = await import('./tournament');
    const result = await play_silent_game(adapter, job.red, job.yellow, job.seed, depth, dims);

    parentPort!.postMessage({ type: 'result', result });
  });
}
