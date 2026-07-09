import type { Game, Move, Place, State, WhichPlayer } from './types';

/* player 1 is P1, player 2 is P2 */

/* either a player has won, it's a draw, or it's ongoing */

/* stringOfPlace:
 * Input: place, Red or Yellow or None
 * Output: corresponding string of each place
 */
function stringOfPlace(place: Place): string {
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
function horzFlip(matrix: Place[][]): Place[][] {
  return [...matrix].reverse();
}

function transpose(matrix: Place[][]): Place[][] {
  if (matrix.length === 0 || matrix[0].length === 0) {
    throw new Error('A matrix cannot be 0-dimensional');
  }
  const height = matrix[0].length;
  const result: Place[][] = [];
  for (let row = 0; row < height; row++) {
    result.push(matrix.map(col => col[row]));
  }
  return result;
}

function mainDiagonal(matrix: Place[][]): Place[] {
  if (matrix.length === 0) throw new Error('error_mainDiagonal');
  if (matrix[0].length === 1) return [matrix[0][0]];
  if (matrix.length === 1) return [matrix[0][0]];
  const rest = matrix.slice(1).map(col => col.slice(1));
  return [matrix[0][0], ...mainDiagonal(rest)];
}

/* halfNW2SEDiagonal:
 * Input: inMatrix, a matrix
 * Output: the diagonal list from NW to SE, but only the half of the matrix
 */
function halfNW2SEDiagonal(matrix: Place[][]): Place[][] {
  if (matrix.length === 0) throw new Error('error_halfNW2SEDiagonal');
  if (matrix.length === 1) return [[matrix[0][0]]];
  const tail = matrix.slice(1);
  return [mainDiagonal(matrix), ...halfNW2SEDiagonal(tail)];
}

/* allDiagonal:
 * Input: inMatrix, a matrix
 * Output: the diagonal list in all conditions
 */
function allDiagonal(matrix: Place[][]): Place[][] {
  return [
    ...halfNW2SEDiagonal(matrix),
    ...halfNW2SEDiagonal(transpose(matrix)),
    ...halfNW2SEDiagonal(horzFlip(matrix)),
    ...halfNW2SEDiagonal(transpose(horzFlip(matrix))),
  ];
}

function stringOfPlayer(player: WhichPlayer): string {
  return player === 'P1' ? 'Player1(Red)' : 'Player2(Yellow)';
}

function stringOfMatrix(matrix: Place[][]): string {
  const stringOfListPlace = (row: Place[]): string => {
    return '|' + row.map(stringOfPlace).join('') + '|\n';
  };
  return transpose(matrix).map(stringOfListPlace).join('');
}

function stringOfState(state: State): string {
  switch (state.status.tag) {
    case 'Win':
      return stringOfPlayer(state.status.player) + 'wins. \n' + stringOfMatrix(state.matrix);
    case 'Draw':
      return 'Game: Draw' + stringOfMatrix(state.matrix);
    case 'Ongoing':
      return (
        "Game is ongoing. It's " +
        stringOfPlayer(state.status.player) +
        "'s turn. \n" +
        stringOfMatrix(state.matrix)
      );
  }
}

function stringOfMove(move: Move): string {
  return 'The player move in No.' + (move.col + 1) + ' column';
}

function otherPlayer(player: WhichPlayer): WhichPlayer {
  return player === 'P1' ? 'P2' : 'P1';
}

function playerToPlace(player: WhichPlayer): Place {
  return player === 'P1' ? 'Red' : 'Yellow';
}

function repeatList<T>(elem: T, num: number): T[] {
  if (num <= 0) return [];
  if (num === 1) return [elem];
  return [elem, ...repeatList(elem, num - 1)];
}

function parseBoardDims(input: string): number[] {
  const trimmed = input.trim();
  if (trimmed === '') return [];
  const s = trimmed + ' ';
  const firstSpace = s.indexOf(' ');
  const numStr = s.substring(0, firstSpace);
  const remainder = s.substring(firstSpace);
  return [parseInt(numStr, 10), ...parseBoardDims(remainder)];
}

function getBoardHeight(dims: number[]): number {
  if (dims.length < 2) throw new Error('invalid dimensions');
  return dims[0];
}

function getBoardWidth(dims: number[]): number {
  if (dims.length < 2) throw new Error('invalid dimensions');
  return dims[1];
}

function initialState(dims: string): State {
  const boardDims = parseBoardDims(dims);
  const boardHeight = getBoardHeight(boardDims);
  const boardWidth = getBoardWidth(boardDims);
  const emptyColumn: Place[] = repeatList('None', boardHeight);
  const initMatrix: Place[][] = repeatList(emptyColumn, boardWidth);
  return {
    status: { tag: 'Ongoing', player: 'P1' },
    matrix: initMatrix,
  };
}

function legalMoves(state: State): Move[] {
  const matrix = state.matrix;
  const result: Move[] = [];
  for (let col = 0; col < matrix.length; col++) {
    if (matrix[col][0] === 'None') {
      result.push({ tag: 'Move', col });
    }
  }
  return result;
}

function gameStatus(state: State): State['status'] {
  return state.status;
}

/* findNReplaceLastNoneInAColumn:
 * Input: alop, inplayer. a column, aka a list of place, and a player
 * Output: a column, aka a list of place, but the last None was replaced
 */
function findNReplaceLastNoneInAColumn(column: Place[], player: WhichPlayer): Place[] {
  if (column.length === 0) throw new Error('error: init matrix error. No empty matrix');
  if (column.length === 1 && column[0] === 'None') {
    return [playerToPlace(player)];
  }
  const [hd, ...tl] = column;
  if (hd === 'None' && tl[0] !== 'None') {
    return [playerToPlace(player), ...tl];
  } else if (hd === 'None' && tl[0] === 'None') {
    return ['None', ...findNReplaceLastNoneInAColumn(tl, player)];
  } else {
    throw new Error('error: column is full. cannot put in');
  }
}

function getHds<T>(arr: T[], num: number): T[] {
  if (num === 0) return [];
  return [arr[0], ...getHds(arr.slice(1), num - 1)];
}

function cullHds<T>(arr: T[], num: number): T[] {
  if (num === 0) return arr;
  return cullHds(arr.slice(1), num - 1);
}

/* isCloneList:
 * Input: aloa. any kind of list
 * Output: bool. if all the elements in the list are same, then true. else, false
 */
function isCloneList<T>(arr: T[]): boolean {
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
function isChainInAColumn(column: Place[], place: Place, chainNum: number): boolean {
  if (column.length < chainNum) return false;
  if (column[0] === place) {
    return (
      isCloneList(getHds(column, chainNum)) ||
      isChainInAColumn(column.slice(1), place, chainNum)
    );
  }
  return isChainInAColumn(column.slice(1), place, chainNum);
}

function countOpenChainInAColumn(column: Place[], place: Place, chainNum: number): number {
  if (column.length < chainNum) return 0;
  if (column[0] === place && isCloneList(getHds(column, chainNum))) {
    return 1 + countOpenChainInAColumn(cullHds(column, chainNum), place, chainNum);
  }
  return countOpenChainInAColumn(column.slice(1), place, chainNum);
}

/* isVerticalChainInAMatrix:
 * Input: (inMatrix, inplace). a matrix and the place looking for
 * Output: bool. if a vertical chain in certain color was found in the matrix, then true. Else, false.
 */
function isVerticalChainInAMatrix(matrix: Place[][], place: Place, chainNum: number): boolean {
  if (matrix.length === 0) throw new Error('error: isChainInAMatrixRough');
  return matrix.some(col => isChainInAColumn(col, place, chainNum));
}

function countOpenVerticalChainInAMatrix(
  matrix: Place[][],
  place: Place,
  chainNum: number,
): number {
  if (matrix.length === 0) throw new Error('error: isChainInAMatrixRough');
  return matrix.reduce((sum, col) => sum + countOpenChainInAColumn(col, place, chainNum), 0);
}

/* isHorizontalChainInAMatrix:
 * Input: (matrix, inPlace). a matrix and the place(color)
 * Output: bool. if a horizontal chain in certain color was found in the column, then true. Else, false.
 */
function isHorizontalChainInAMatrix(matrix: Place[][], place: Place, chainNum: number): boolean {
  return isVerticalChainInAMatrix(transpose(matrix), place, chainNum);
}

function countHorizontalChainInAMatrix(matrix: Place[][], place: Place, chainNum: number): number {
  return countOpenVerticalChainInAMatrix(transpose(matrix), place, chainNum);
}

function isDiagonalChainInAMatrix(matrix: Place[][], place: Place, chainNum: number): boolean {
  return isVerticalChainInAMatrix(allDiagonal(matrix), place, chainNum);
}

function countOpenDiagonalChainInAMatrix(
  matrix: Place[][],
  place: Place,
  chainNum: number,
): number {
  return countOpenVerticalChainInAMatrix(allDiagonal(matrix), place, chainNum);
}

function isChainInAMatrix(matrix: Place[][], place: Place, chainNum: number): boolean {
  return (
    isVerticalChainInAMatrix(matrix, place, chainNum) ||
    isHorizontalChainInAMatrix(matrix, place, chainNum) ||
    isDiagonalChainInAMatrix(matrix, place, chainNum)
  );
}

function countOpenChainInAMatrix(matrix: Place[][], place: Place, chainNum: number): number {
  return (
    countOpenVerticalChainInAMatrix(matrix, place, chainNum) +
    countHorizontalChainInAMatrix(matrix, place, chainNum) +
    countOpenDiagonalChainInAMatrix(matrix, place, chainNum)
  );
}

function nextStateHelper(matrix: Place[][], col: number, player: WhichPlayer): Place[][] {
  if (matrix.length === 0) throw new Error('error: nextStateHelper');
  if (col === 0) {
    if (matrix.length === 1 && matrix[0].length === 1 && matrix[0][0] === 'None') {
      return [[playerToPlace(player)]];
    }
    return [findNReplaceLastNoneInAColumn(matrix[0], player), ...matrix.slice(1)];
  }
  return [matrix[0], ...nextStateHelper(matrix.slice(1), col - 1, player)];
}

function checkChain(matrix: Place[][], player: WhichPlayer, chainNum: number): boolean {
  return isChainInAMatrix(matrix, playerToPlace(player), chainNum);
}

function countChain(matrix: Place[][], player: WhichPlayer, chainNum: number): number {
  return countOpenChainInAMatrix(matrix, playerToPlace(player), chainNum);
}

/* nextState:
 * Input: (state, move).
 * Output: state.
 */
function nextState(state: State, move: Move): State {
  if (state.status.tag === 'Win' || state.status.tag === 'Draw') {
    return state;
  }
  const player = state.status.player;
  const newMatrix = nextStateHelper(state.matrix, move.col, player);
  if (checkChain(newMatrix, player, 4)) {
    return { status: { tag: 'Win', player }, matrix: newMatrix };
  } else if (!state.matrix.flat().includes('None')) {
    // NOTE: original ReasonML checks the *old* matrix for a full board, preserved exactly.
    return { status: { tag: 'Draw' }, matrix: newMatrix };
  } else {
    return { status: { tag: 'Ongoing', player: otherPlayer(player) }, matrix: newMatrix };
  }
}

function moveOfString(input: string, state: State): Move {
  const col = parseInt(input, 10);
  if (isNaN(col)) throw new Error('error: illegal move');
  const move: Move = { tag: 'Move', col: col - 1 };
  if (legalMoves(state).some(m => m.col === move.col)) {
    return move;
  }
  throw new Error('error: illegal move');
}

function estimateValue(state: State): number {
  if (state.status.tag !== 'Ongoing') return 0.0;
  const player = state.status.player;
  const matrix = state.matrix;
  if (checkChain(matrix, player, 4)) {
    return player === 'P1' ? 1000.0 : -1000.0;
  }
  if (player === 'P1') {
    return (
      countOpenChainInAMatrix(matrix, 'Red', 3) +
      0.5 * countOpenChainInAMatrix(matrix, 'Red', 2) +
      0.25 * countOpenChainInAMatrix(matrix, 'Red', 1)
    );
  } else {
    return (
      -1.0 *
      (countOpenChainInAMatrix(matrix, 'Yellow', 3) +
        0.5 * countOpenChainInAMatrix(matrix, 'Yellow', 2) +
        0.25 * countOpenChainInAMatrix(matrix, 'Yellow', 1))
    );
  }
}

export const connect4: Game = {
  stringOfPlayer,
  stringOfState,
  stringOfMove,
  initialState,
  legalMoves,
  gameStatus,
  nextState,
  moveOfString,
  estimateValue,
};
