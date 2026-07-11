import { debug_log } from '../algo/printer';
import type { CellCoord, Game, Status, WhichPlayer } from '../algo/types';

export type GomokuPlace = 'Black' | 'White' | 'None';

export interface GomokuState {
  status: Status;
  matrix: GomokuPlace[][];
}

export interface GomokuMove {
  tag: 'Move';
  row: number;
  col: number;
}

const DIRECTIONS = [
  { dc: 1, dr: 0 },  // horizontal
  { dc: 0, dr: 1 },  // vertical
  { dc: 1, dr: 1 },  // diagonal \
  { dc: 1, dr: -1 }, // diagonal /
];

function stringOfPlace(place: GomokuPlace): string {
  switch (place) {
    case 'Black':
      return '●';
    case 'White':
      return '○';
    case 'None':
      return '·';
  }
}

function str_player(player: WhichPlayer): string {
  return player === 'P1' ? 'Player1(Black)' : 'Player2(White)';
}

function stringOfMatrix(matrix: GomokuPlace[][]): string {
  return matrix
    .map((row) => '|' + row.map(stringOfPlace).join(' ') + '|')
    .join('\n');
}

function str_state(state: GomokuState): string {
  switch (state.status.tag) {
    case 'Win':
      return str_player(state.status.player) + ' wins. \n' + stringOfMatrix(state.matrix);
    case 'Draw':
      return 'Game: Draw\n' + stringOfMatrix(state.matrix);
    case 'Ongoing':
      return (
        "Game is ongoing. It's " +
        str_player(state.status.player) +
        "'s turn. \n" +
        stringOfMatrix(state.matrix)
      );
  }
}

function str_move(move: GomokuMove): string {
  return `The player places at row ${move.row + 1}, col ${move.col + 1}`;
}

function otherPlayer(player: WhichPlayer): WhichPlayer {
  return player === 'P1' ? 'P2' : 'P1';
}

function get_player_s_place(player: WhichPlayer): GomokuPlace {
  return player === 'P1' ? 'Black' : 'White';
}

function gen_list<T>(elem: T, num: number): T[] {
  if (num <= 0) return [];
  if (num === 1) return [elem];
  return [elem, ...gen_list(elem, num - 1)];
}

function parse_dims(input: string): number[] {
  const trimmed = input.trim();
  if (trimmed === '') return [];
  const s = trimmed + ' ';
  const firstSpace = s.indexOf(' ');
  const numStr = s.substring(0, firstSpace);
  const remainder = s.substring(firstSpace);
  return [parseInt(numStr, 10), ...parse_dims(remainder)];
}

function get_board_height(dims: number[]): number {
  if (dims.length < 2) throw new Error('invalid dimensions');
  return dims[0];
}

function get_board_width(dims: number[]): number {
  if (dims.length < 2) throw new Error('invalid dimensions');
  return dims[1];
}

function init(dims: string): GomokuState {
  const boardDims = parse_dims(dims);
  const boardHeight = get_board_height(boardDims);
  const boardWidth = get_board_width(boardDims);
  const emptyRow: GomokuPlace[] = gen_list('None', boardWidth);
  const initMatrix: GomokuPlace[][] = gen_list(emptyRow, boardHeight);
  return {
    status: { tag: 'Ongoing', player: 'P1' },
    matrix: initMatrix,
  };
}

function in_bounds(row: number, col: number, height: number, width: number): boolean {
  return row >= 0 && row < height && col >= 0 && col < width;
}

function get_legal_moves(state: GomokuState): GomokuMove[] {
  const board = state.matrix;
  const height = board.length;
  const width = height > 0 ? board[0].length : 0;

  const is_empty = board.every((row) => row.every((cell) => cell === 'None'));
  if (is_empty) {
    const moves: GomokuMove[] = [];
    const centerRow = Math.floor(height / 2);
    const centerCol = Math.floor(width / 2);
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const r = centerRow + dr;
        const c = centerCol + dc;
        if (in_bounds(r, c, height, width)) {
          moves.push({ tag: 'Move', row: r, col: c });
        }
      }
    }
    return moves;
  }

  const allowed = new Set<string>();
  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      if (board[row][col] === 'None') continue;
      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          if (dr === 0 && dc === 0) continue;
          const r = row + dr;
          const c = col + dc;
          if (in_bounds(r, c, height, width) && board[r][c] === 'None') {
            allowed.add(`${r},${c}`);
          }
        }
      }
    }
  }

  const moves: GomokuMove[] = [];
  allowed.forEach((key) => {
    const [r, c] = key.split(',').map(Number);
    moves.push({ tag: 'Move', row: r, col: c });
  });
  return moves;
}

function get_game_status(state: GomokuState): GomokuState['status'] {
  return state.status;
}

function has_five_in_a_row(board: GomokuPlace[][], place: GomokuPlace): boolean {
  const height = board.length;
  const width = height > 0 ? board[0].length : 0;

  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      if (board[row][col] !== place) continue;
      for (const { dc, dr } of DIRECTIONS) {
        let count = 0;
        let r = row;
        let c = col;
        while (in_bounds(r, c, height, width) && board[r][c] === place) {
          count++;
          r += dr;
          c += dc;
        }
        if (count >= 5) return true;
      }
    }
  }
  return false;
}

function find_winning_cells(
  board: GomokuPlace[][],
  target_place: GomokuPlace,
): CellCoord[] | null {
  const height = board.length;
  const width = height > 0 ? board[0].length : 0;

  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      if (board[row][col] !== target_place) continue;
      for (const { dc, dr } of DIRECTIONS) {
        const cells: CellCoord[] = [];
        for (let i = 0; i < 5; i++) {
          const r = row + dr * i;
          const c = col + dc * i;
          if (!in_bounds(r, c, height, width)) break;
          if (board[r][c] !== target_place) break;
          cells.push({ col: c, row: r });
        }
        if (cells.length === 5) return cells;
      }
    }
  }
  return null;
}

function is_board_full(board: GomokuPlace[][]): boolean {
  return board.every((row) => row.every((cell) => cell !== 'None'));
}

function put_place(
  board: GomokuPlace[][],
  move: GomokuMove,
  player: WhichPlayer,
): GomokuPlace[][] {
  const place = get_player_s_place(player);
  return board.map((row, r) =>
    row.map((cell, c) => (r === move.row && c === move.col ? place : cell)),
  );
}

function get_next_state(state: GomokuState, move: GomokuMove): GomokuState {
  if (state.status.tag === 'Win' || state.status.tag === 'Draw') {
    return state;
  }

  const current_player = state.status.player;
  const next_player = otherPlayer(current_player);
  const next_matrix = put_place(state.matrix, move, current_player);

  if (has_five_in_a_row(next_matrix, get_player_s_place(current_player))) {
    return { status: { tag: 'Win', player: current_player }, matrix: next_matrix };
  } else if (is_board_full(next_matrix)) {
    return { status: { tag: 'Draw' }, matrix: next_matrix };
  } else {
    return { status: { tag: 'Ongoing', player: next_player }, matrix: next_matrix };
  }
}

export function get_winning_cells(state: GomokuState): CellCoord[] | null {
  if (state.status.tag !== 'Win') return null;
  return find_winning_cells(state.matrix, get_player_s_place(state.status.player));
}

function get_move(input: string, state: GomokuState): GomokuMove {
  const parts = input.trim().split(/\s+/);
  if (parts.length !== 2) throw new Error('error: illegal move, expected "row col"');
  const row = parseInt(parts[0], 10) - 1;
  const col = parseInt(parts[1], 10) - 1;
  if (isNaN(row) || isNaN(col)) throw new Error('error: illegal move');

  const move: GomokuMove = { tag: 'Move', row, col };
  if (get_legal_moves(state).some((m) => m.row === move.row && m.col === move.col)) {
    return move;
  }
  throw new Error('error: illegal move');
}

function count_chains_with_open_ends(
  board: GomokuPlace[][],
  place: GomokuPlace,
  length: number,
  minOpenEnds: number,
): number {
  const height = board.length;
  const width = height > 0 ? board[0].length : 0;
  let count = 0;

  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      if (board[row][col] !== place) continue;
      for (const { dc, dr } of DIRECTIONS) {
        const prevRow = row - dr;
        const prevCol = col - dc;
        if (
          in_bounds(prevRow, prevCol, height, width) &&
          board[prevRow][prevCol] === place
        ) {
          continue;
        }

        let len = 0;
        let r = row;
        let c = col;
        while (in_bounds(r, c, height, width) && board[r][c] === place) {
          len++;
          r += dr;
          c += dc;
        }
        if (len !== length) continue;

        const prevOpen =
          !in_bounds(prevRow, prevCol, height, width) ||
          board[prevRow][prevCol] === 'None';
        const nextOpen = !in_bounds(r, c, height, width) || board[r][c] === 'None';
        const openEnds = (prevOpen ? 1 : 0) + (nextOpen ? 1 : 0);

        if (openEnds >= minOpenEnds) count++;
      }
    }
  }

  return count;
}

function get_score(state: GomokuState): number {
  const board = state.matrix;

  const is_p1_win = has_five_in_a_row(board, 'Black');
  const is_p2_win = has_five_in_a_row(board, 'White');

  if (is_p1_win && is_p2_win) {
    debug_log('Not valid, both wins');
    return 0;
  }

  if (is_board_full(board)) {
    return 0;
  }

  if (is_p1_win) {
    const score = 1000;
    debug_log('Find win case: ' + score);
    return score;
  }

  if (is_p2_win) {
    const score = -1000;
    debug_log('Find win case for MIN: ' + score);
    return score;
  }

  const p1_score =
    1 * count_chains_with_open_ends(board, 'Black', 4, 1) +
    0.75 * count_chains_with_open_ends(board, 'Black', 3, 2) +
    0.5 * count_chains_with_open_ends(board, 'Black', 3, 1) +
    0.1 * count_chains_with_open_ends(board, 'Black', 2, 2) +
    0.05 * count_chains_with_open_ends(board, 'Black', 2, 1);

  const p2_score =
    1 * count_chains_with_open_ends(board, 'White', 4, 1) +
    0.75 * count_chains_with_open_ends(board, 'White', 3, 2) +
    0.5 * count_chains_with_open_ends(board, 'White', 3, 1) +
    0.1 * count_chains_with_open_ends(board, 'White', 2, 2) +
    0.05 * count_chains_with_open_ends(board, 'White', 2, 1);

  const score = p1_score - p2_score;
  debug_log('Not finished and score is ' + score);
  return score;
}

export const gomoku: Game<GomokuState, GomokuMove> = {
  str_player,
  str_state,
  str_move,
  init,
  get_legal_moves,
  get_game_status,
  get_next_state,
  get_move,
  get_score,
};

export default gomoku;
