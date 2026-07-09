import { connect4 } from './connect4';
import { createAIPlayer } from './aiPlayer';
import { createHumanPlayer } from './humanPlayer';
import { playGame } from './referee';

const mode = process.argv[2] || 'human-ai';

switch (mode) {
  case 'ai': {
    const p1 = createAIPlayer(connect4, 'TopG');
    const p2 = createAIPlayer(connect4, 'TopG');
    playGame(connect4, p1, p2);
    break;
  }
  case 'human': {
    const p1 = createHumanPlayer(connect4, 'Alex');
    const p2 = createHumanPlayer(connect4, 'Alex');
    playGame(connect4, p1, p2);
    break;
  }
  case 'human-ai':
  default: {
    const p1 = createHumanPlayer(connect4, 'Alex');
    const p2 = createAIPlayer(connect4, 'TopG');
    playGame(connect4, p1, p2);
    break;
  }
}
