import type { Game, Move, Player, PlayerName, State } from './types';

const PLACE_CLASSES: Record<string, string> = {
  Red: 'place-red',
  Yellow: 'place-yellow',
  None: 'place-none',
};

export function create_web_human_player(
  game: Game,
  name: PlayerName,
  boardEl: HTMLElement,
  statusEl?: HTMLElement,
): Player {
  let resolver: ((move: Move) => void) | null = null;

  const render = (state: State): void => {
    boardEl.innerHTML = '';
    const matrix = state.matrix; // matrix[col][row]
    const width = matrix.length;
    const height = width > 0 ? matrix[0].length : 0;

    const grid = document.createElement('div');
    grid.className = 'board-grid';
    grid.style.gridTemplateColumns = `repeat(${width}, 1fr)`;

    for (let row = 0; row < height; row++) {
      for (let col = 0; col < width; col++) {
        const cell = document.createElement('div');
        cell.className = `board-cell ${PLACE_CLASSES[matrix[col][row]]}`;
        cell.dataset.col = String(col);
        cell.addEventListener('click', () => {
          if (!resolver) return;
          const legal = game.get_legal_moves(state).some(m => m.col === col);
          if (!legal) return;
          const r = resolver;
          resolver = null;
          r({ tag: 'Move', col });
        });
        grid.appendChild(cell);
      }
    }

    boardEl.appendChild(grid);

    if (statusEl) {
      statusEl.textContent = game.str_state(state).split('\n')[0];
    }
  };

  function get_next_move(state: State): Promise<Move> {
    render(state);
    return new Promise((resolve) => {
      resolver = resolve;
    });
  }

  return {
    game_ref: game,
    get_next_move,
    player_name: name,
  };
}
