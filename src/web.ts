import { connect4 } from "./connect4";
import { create_AI_player } from "./aiPlayer";
import { create_web_human_player } from "./webPlayer";
import { playGame } from "./referee";
import type { Player, State } from "./types";

const modeSelect = document.getElementById("mode") as HTMLSelectElement;
const startBtn = document.getElementById("start") as HTMLButtonElement;
const statusEl = document.getElementById("status") as HTMLElement;
const boardEl = document.getElementById("board") as HTMLElement;
const terminalEl = document.getElementById("terminal") as HTMLElement;

function renderState(state: State): void {
  const matrix = state.matrix;
  const width = matrix.length;
  const height = width > 0 ? matrix[0].length : 0;

  boardEl.innerHTML = '';
  const grid = document.createElement('div');
  grid.className = 'board-grid';
  grid.style.gridTemplateColumns = `repeat(${width}, 1fr)`;

  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      const cell = document.createElement('div');
      const place = matrix[col][row];
      cell.className = 'board-cell';
      if (place === 'Red') cell.classList.add('place-red');
      else if (place === 'Yellow') cell.classList.add('place-yellow');
      else cell.classList.add('place-none');
      grid.appendChild(cell);
    }
  }

  boardEl.appendChild(grid);
  statusEl.textContent = connect4.str_state(state).split('\n')[0];
}

function wrapWithRenderer(player: Player): Player {
  return {
    ...player,
    get_next_move: async (state) => {
      renderState(state);
      return await player.get_next_move(state);
    },
  };
}

startBtn.addEventListener("click", async () => {
  const mode = modeSelect.value;
  statusEl.textContent = "Game started...";
  terminalEl.innerHTML = "";

  let p1: Player;
  let p2: Player;

  switch (mode) {
    case "ai": {
      p1 = wrapWithRenderer(create_AI_player(connect4, "MAX"));
      p2 = wrapWithRenderer(create_AI_player(connect4, "MIN"));
      break;
    }
    case "human": {
      p1 = create_web_human_player(connect4, "MAX", boardEl, statusEl);
      p2 = create_web_human_player(connect4, "MIN", boardEl, statusEl);
      break;
    }
    case "human-ai":
    default: {
      p1 = create_web_human_player(connect4, "MAX", boardEl, statusEl);
      p2 = wrapWithRenderer(create_AI_player(connect4, "MIN"));
      break;
    }
  }

  const finalState = await playGame(connect4, p1, p2, "5 6");
  renderState(finalState);
});
