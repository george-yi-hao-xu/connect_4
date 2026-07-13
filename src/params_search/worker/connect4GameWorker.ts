import { connect4_adapter } from '../adapters/connect4Adapter';
import { start_worker } from '../core/worker';

start_worker({ connect4: connect4_adapter });
