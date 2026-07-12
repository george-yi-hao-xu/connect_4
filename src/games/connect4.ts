import { debug_log } from '../algo/printer';
import type { CellCoord, Game, Status, WhichPlayer } from '../algo/types';

/* player 1 is P1, player 2 is P2 */

/* either a player has won, it's a draw, or it's ongoing */

export type Connect4Place = 'Red' | 'Yellow' | 'None';

export interface Connect4State {
  status: Status;
  matrix: Connect4Place[][];
}

export interface Connect4Move {
  tag: 'Move';
  col: number;
}

export interface Connect4ChainWeights {
  chain3: number;
  chain2: number;
  chain1: number;
}

export interface Connect4ScoreWeights {
  win: number;
  red: Connect4ChainWeights;
  yellow: Connect4ChainWeights;
}

export type Connect4ScoreWeightParams = Partial<{
  win: number;
  red: Partial<Connect4ChainWeights>;
  yellow: Partial<Connect4ChainWeights>;
}>;

export const default_connect4_score_weights: Connect4ScoreWeights = {
  win: 1000,
  red: {
    chain3: 1.00,
    chain2: 0.50,
    chain1: 0.25,
  },
  yellow: {
    chain3: 1.00,
    chain2: 0.50,
    chain1: 0.25,
  },
};

/* stringOfPlace:
 * Input: place, Red or Yellow or None
 * Output: corresponding string of each place
 */
function stringOfPlace(place: Connect4Place): string {
  switch (place) {
    case 'Red':
      return '\x1b[31m--Red---\x1b[0m';
    case 'Yellow':
      return '\x1b[33m-Yellow-\x1b[0m';
    case 'None':
      return '\x1b[32m--None--\x1b[0m';
  }
}

/* matrix proc */
function matrix_hori_flip(matrix: Connect4Place[][]): Connect4Place[][] {
  return [...matrix].reverse();
}

function matrix_transpose(matrix: Connect4Place[][]): Connect4Place[][] {
  if (matrix.length === 0 || matrix[0].length === 0) {
    throw new Error('A matrix cannot be 0-dimensional');
  }
  const height = matrix[0].length;
  const result: Connect4Place[][] = [];
  for (let row = 0; row < height; row++) {
    result.push(matrix.map(col => col[row]));
  }
  return result;
}

/**
 * For matrix like
 * a b b
 * b b b
 * a a a
 * it will return [a, b, a]
 */
function get_main_diag(matrix: Connect4Place[][]): Connect4Place[] {
  if (matrix.length === 0) throw new Error('error_mainDiagonal');
  // only 1 row
  if (matrix[0].length === 1) return [matrix[0][0]];
  // only 1 col
  if (matrix.length === 1) return [matrix[0][0]];

  const rest = matrix.slice(1).map(col => col.slice(1));
  return [matrix[0][0], ...get_main_diag(rest)];
}

/* allDiagonal:
 * Input: inMatrix, a matrix
 * Output: the diagonal list in all conditions
 */
function get_all_diag(matrix: Connect4Place[][]): Connect4Place[][] {
  if (matrix.length === 0) throw new Error("bad matrix");
  if (matrix[0].length === 0) throw new Error("bad matrix");

  // Diagonals that start on the top edge and go down-right (\).
  const get_top_diags = (in_matrix: Connect4Place[][]): Connect4Place[][] => {
    if (in_matrix.length === 0) return [];
    return [
      get_main_diag(in_matrix),
      ...get_top_diags(in_matrix.slice(1))
    ];
  }

  // Diagonals that start on the left edge below the top-left corner and go down-right (\).
  // Dropping one row makes the next left-edge cell become the new top-left cell.
  const get_left_diags = (in_matrix: Connect4Place[][]): Connect4Place[][] => {
    if (in_matrix.length === 0 || in_matrix[0].length <= 1) return [];
    const tail = in_matrix.map(col => col.slice(1));
    return [
      get_main_diag(tail),
      ...get_left_diags(tail)
    ];
  }

  // All down-right (\) diagonals are the top-edge starts plus the left-edge starts.
  const get_down_right_diags = (in_matrix: Connect4Place[][]): Connect4Place[][] => {
    return [
      ...get_top_diags(in_matrix),
      ...get_left_diags(in_matrix),
    ];
  }

  // The flipped matrix reuses the same down-right logic to find the other (/) direction.
  return [
    ...get_down_right_diags(matrix),
    ...get_down_right_diags(matrix_hori_flip(matrix)),
  ];
}

function str_player(player: WhichPlayer): string {
  return player === 'P1' ? 'Player1(Red)' : 'Player2(Yellow)';
}

function stringOfMatrix(matrix: Connect4Place[][]): string {
  const stringOfListPlace = (row: Connect4Place[]): string => {
    return '|' + row.map(stringOfPlace).join('') + '|\n';
  };
  return matrix_transpose(matrix).map(stringOfListPlace).join('');
}

function str_state(state: Connect4State): string {
  switch (state.status.tag) {
    case 'Win':
      return str_player(state.status.player) + 'wins. \n' + stringOfMatrix(state.matrix);
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

function str_move(move: Connect4Move): string {
  return 'The player move in No.' + (move.col + 1) + ' column';
}

function otherPlayer(player: WhichPlayer): WhichPlayer {
  return player === 'P1' ? 'P2' : 'P1';
}

function get_player_s_place(player: WhichPlayer): Connect4Place {
  return player === 'P1' ? 'Red' : 'Yellow';
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

function init(dims: string): Connect4State {
  const boardDims = parse_dims(dims);
  const boardHeight = get_board_height(boardDims);
  const boardWidth = get_board_width(boardDims);
  const emptyColumn: Connect4Place[] = gen_list('None', boardHeight);
  const initMatrix: Connect4Place[][] = gen_list(emptyColumn, boardWidth);
  return {
    status: { tag: 'Ongoing', player: 'P1' },
    matrix: initMatrix,
  };
}

function get_legal_moves(state: Connect4State): Connect4Move[] {
  const matrix = state.matrix;
  const result: Connect4Move[] = [];

  for (let col = 0; col < matrix.length; col++) {
    if (matrix[col][0] === 'None') {
      result.push({ tag: 'Move', col });
    }
  }

  return result;
}

function get_game_status(state: Connect4State): Connect4State['status'] {
  return state.status;
}

/* findNReplaceLastNoneInAColumn:
 * Input: alop, inplayer. a column, aka a list of place, and a player
 * Output: a column, aka a list of place, but the last None was replaced
 */
function put_place_in_col(column: Connect4Place[], player: WhichPlayer): Connect4Place[] {
  if (column.length === 0) throw new Error('error: init matrix error. No empty matrix');
  if (column.length === 1 && column[0] === 'None') {
    return [get_player_s_place(player)];
  }
  const [hd, ...tl] = column;
  if (hd === 'None' && tl[0] !== 'None') {
    return [get_player_s_place(player), ...tl];
  } else if (hd === 'None' && tl[0] === 'None') {
    return ['None', ...put_place_in_col(tl, player)];
  } else {
    throw new Error('error: column is full. cannot put in');
  }
}

function get_heads<T>(arr: T[], num: number): T[] {
  if (num === 0) return [];
  return [arr[0], ...get_heads(arr.slice(1), num - 1)];
}

function cull_heads<T>(arr: T[], num: number): T[] {
  if (num === 0) return arr;
  return cull_heads(arr.slice(1), num - 1);
}

/**
 * Input: aloa. any kind of list
 * Output: bool. if all the elements in the list are same, then true. else, false
 */
function is_list_ele_uniform<T>(arr: T[]): boolean {
  if (arr.length <= 1) return false;
  for (let i = 1; i < arr.length; i++) {
    if (arr[i] !== arr[0]) return false;
  }
  return true;
}

/* isChainInAColumn:
 * Input: (inColumn, inPlace). a list of place and the place(color)
 * Output: bool. if a chain in certain color was found in the column, then true. Else, false.
 */
function has_chain_in_col(column: Connect4Place[], place: Connect4Place, chainNum: number): boolean {
  if (column.length < chainNum) return false;
  if (column[0] === place) {
    return (
      is_list_ele_uniform(get_heads(column, chainNum)) ||
      has_chain_in_col(column.slice(1), place, chainNum)
    );
  }
  return has_chain_in_col(column.slice(1), place, chainNum);
}

function count_open_chain_col(column: Connect4Place[], place: Connect4Place, chainNum: number): number {
  if (column.length < chainNum) return 0;
  if (column[0] === place && is_list_ele_uniform(get_heads(column, chainNum))) {
    return 1 + count_open_chain_col(cull_heads(column, chainNum), place, chainNum);
  }
  return count_open_chain_col(column.slice(1), place, chainNum);
}

/* isVerticalChainInAMatrix:
 * Input: (inMatrix, inplace). a matrix and the place looking for
 * Output: bool. if a vertical chain in certain color was found in the matrix, then true. Else, false.
 */
function check_vert_chain(matrix: Connect4Place[][], place: Connect4Place, chain_num: number): boolean {
  if (matrix.length === 0) throw new Error('error: bad matrix');
  return matrix.some(col => has_chain_in_col(col, place, chain_num));
}

function count_vert_open_chain(
  matrix: Connect4Place[][],
  place: Connect4Place,
  chainNum: number,
): number {
  if (matrix.length === 0) throw new Error('error: isChainInAMatrixRough');
  return matrix.reduce((sum, col) => sum + count_open_chain_col(col, place, chainNum), 0);
}

/* isHorizontalChainInAMatrix:
 * Input: (matrix, inPlace). a matrix and the place(color)
 * Output: bool. if a horizontal chain in certain color was found in the column, then true. Else, false.
 */
function check_hori_chain(matrix: Connect4Place[][], place: Connect4Place, chainNum: number): boolean {
  return check_vert_chain(matrix_transpose(matrix), place, chainNum);
}

function count_hori_open_chain(matrix: Connect4Place[][], place: Connect4Place, chainNum: number): number {
  return count_vert_open_chain(matrix_transpose(matrix), place, chainNum);
}

function check_diag_chain(matrix: Connect4Place[][], place: Connect4Place, chainNum: number): boolean {
  return check_vert_chain(get_all_diag(matrix), place, chainNum);
}

function count_diag_open_chain(
  matrix: Connect4Place[][],
  place: Connect4Place,
  chainNum: number,
): number {
  return count_vert_open_chain(get_all_diag(matrix), place, chainNum);
}

function has_chain(matrix: Connect4Place[][], place: Connect4Place, chainNum: number): boolean {
  return (
    check_vert_chain(matrix, place, chainNum) ||
    check_hori_chain(matrix, place, chainNum) ||
    check_diag_chain(matrix, place, chainNum)
  );
}

// only for web front end rendering winning ui
function find_winning_cells(matrix: Connect4Place[][], target_place: Connect4Place): CellCoord[] | null {
  const width = matrix.length;
  if (width === 0) return null;
  const height = matrix[0].length;

  const directions = [
    { dc: 0, dr: 1 },  // vertical
    { dc: 1, dr: 0 },  // horizontal
    { dc: 1, dr: 1 },  // diagonal down-right
    { dc: 1, dr: -1 }, // diagonal up-right
  ];

  for (let col = 0; col < width; col++) {
    for (let row = 0; row < height; row++) {
      if (matrix[col][row] !== target_place) continue;
      for (const { dc, dr } of directions) {
        const cells: CellCoord[] = [];
        for (let i = 0; i < 4; i++) {
          const c = col + dc * i;
          const r = row + dr * i;
          if (c < 0 || c >= width || r < 0 || r >= height) break;
          if (matrix[c][r] !== target_place) break;
          cells.push({ col: c, row: r });
        }
        if (cells.length === 4) return cells;
      }
    }
  }
  return null;
}

function count_open_chain(matrix: Connect4Place[][], place: Connect4Place, chainNum: number): number {
  return (
    count_vert_open_chain(matrix, place, chainNum) +
    count_hori_open_chain(matrix, place, chainNum) +
    count_diag_open_chain(matrix, place, chainNum)
  );
}

function put_place(matrix: Connect4Place[][], col_idx: number, player: WhichPlayer): Connect4Place[][] {
  if (matrix.length === 0) throw new Error('error: nextStateHelper');

  // put in the 1st/heading col
  if (col_idx === 0) {
    if (matrix.length === 1 && matrix[0].length === 1 && matrix[0][0] === 'None') {
      return [[get_player_s_place(player)]];
    }
    const rest_cols = matrix.slice(1)
    return [put_place_in_col(matrix[0], player), ...rest_cols];
  }

  return [matrix[0], ...put_place(matrix.slice(1), col_idx - 1, player)];
}

function check_chain(matrix: Connect4Place[][], player: WhichPlayer, chainNum: number): boolean {
  return has_chain(matrix, get_player_s_place(player), chainNum);
}

function countChain(matrix: Connect4Place[][], player: WhichPlayer, chainNum: number): number {
  return count_open_chain(matrix, get_player_s_place(player), chainNum);
}

// determine win/lose/ongoing
function get_next_state(state: Connect4State, move: Connect4Move): Connect4State {
  // game already finished
  if (state.status.tag === 'Win' || state.status.tag === 'Draw') {
    return state;
  }

  const current_player = state.status.player;
  const next_player = otherPlayer(current_player)
  const next_matrix = put_place(state.matrix, move.col, current_player);

  if (check_chain(next_matrix, current_player, 4)) {
    return { status: { tag: 'Win', player: current_player }, matrix: next_matrix };
  } else if (!next_matrix.flat().includes('None')) {
    return { status: { tag: 'Draw' }, matrix: next_matrix };
  } else {
    return { status: { tag: 'Ongoing', player: next_player }, matrix: next_matrix };
  }
}

export function get_winning_cells(state: Connect4State): CellCoord[] | null {
  if (state.status.tag !== 'Win') return null;
  return find_winning_cells(state.matrix, get_player_s_place(state.status.player));
}

function get_move(input: string, state: Connect4State): Connect4Move {
  const col = parseInt(input, 10);
  if (isNaN(col)) throw new Error('error: illegal move');
  const move: Connect4Move = { tag: 'Move', col: col - 1 };
  if (get_legal_moves(state).some(m => m.col === move.col)) {
    return move;
  }
  throw new Error('error: illegal move');
}

function resolve_connect4_score_weights(params: Connect4ScoreWeightParams = {}): Connect4ScoreWeights {
  return {
    win: params.win ?? default_connect4_score_weights.win,
    red: {
      ...default_connect4_score_weights.red,
      ...params.red,
    },
    yellow: {
      ...default_connect4_score_weights.yellow,
      ...params.yellow,
    },
  };
}

// JUDGE the state and give back score
function get_score(
  state: Connect4State,
  weights: Connect4ScoreWeights = default_connect4_score_weights,
): number {
  const matrix = state.matrix;

  const is_p1_win = check_chain(matrix, 'P1', 4);
  const is_p2_win = check_chain(matrix, 'P2', 4);
  const is_full = !state.matrix.flat().includes("None")

  if (is_p1_win && is_p2_win) {
    debug_log("Not valid, both wins")
    return 0;
  }

  if (is_full) {
    // draw
    return 0;
  }

  // win/lose
  if (is_p1_win) {
    // max player wins
    const score = weights.win;
    debug_log("Find win case: " + score)
    return score;
  }
  else if (is_p2_win) {
    // min player wins
    const score = -weights.win;
    debug_log("Find win case for MIN: " + score)
    return score
  } else {
  // ongoing
    const p1_chain_score = 
        weights.red.chain3 * count_open_chain(matrix, 'Red', 3) +
        weights.red.chain2 * count_open_chain(matrix, 'Red', 2) +
        weights.red.chain1 * count_open_chain(matrix, 'Red', 1)
    const p2_chain_score = -1 * (
        weights.yellow.chain3 * count_open_chain(matrix, 'Yellow', 3) +
        weights.yellow.chain2 * count_open_chain(matrix, 'Yellow', 2) +
        weights.yellow.chain1 * count_open_chain(matrix, 'Yellow', 1)
    )
    const score = p1_chain_score + p2_chain_score
    debug_log("Not finished and score is " + score)
    return score
  }
}

export function create_connect4(
  score_weight_params: Connect4ScoreWeightParams = {},
): Game<Connect4State, Connect4Move> {
  const score_weights = resolve_connect4_score_weights(score_weight_params);

  return {
    str_player,
    str_state,
    str_move,
    init,
    get_legal_moves,
    get_game_status,
    get_next_state,
    get_move,
    get_score: (state) => get_score(state, score_weights),
  };
}

export const connect4: Game<Connect4State, Connect4Move> = create_connect4();

export default connect4;
