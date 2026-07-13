import { gomoku_adapter } from '../adapters/gomokuAdapter';
import { start_worker } from '../core/worker';

start_worker({ gomoku: gomoku_adapter });
