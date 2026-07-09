import type { Game, Move, Player, State, WhichPlayer } from './types';

type MovePath = Move[];

export function createAIPlayer(game: Game, name: string): Player {
  /* pair2lists
   * Input: listA with type list('a), listB with type list('b)
   * Output: a list of pairs. Each pair has the type ('a,'b)
   */
  function pair2lists<A, B>(listA: A[], listB: B[]): [A, B][] {
    if (listA.length === 0 && listB.length === 0) return [];
    if (listA.length !== listB.length) throw new Error('error: pair2lists');
    const result: [A, B][] = [];
    for (let i = 0; i < listA.length; i++) {
      result.push([listA[i], listB[i]]);
    }
    return result;
  }

  /* lookUpMax:
   * Input: alop, a list of pairs, with type('a, float)
   * Output: 'a, the item w/ largest float number
   */
  function lookUpMax<A>(pairs: [A, number][]): A {
    if (pairs.length === 0) throw new Error('Error: cannot lookUpMax in ');
    let bestItem = pairs[0][0];
    let bestVal = pairs[0][1];
    for (const [item, val] of pairs) {
      if (val > bestVal) {
        bestItem = item;
        bestVal = val;
      }
    }
    return bestItem;
  }

  /* lookUpMin:
   * Input: alop, a list of pairs, with type('a, float)
   * Output: 'a, the item w/ smallest float number
   */
  function lookUpMin<A>(pairs: [A, number][]): A {
    const opposite = pairs.map(([item, val]) => [item, -val] as [A, number]);
    return lookUpMax(opposite);
  }

  /* checkWhichPlayer:
   * Input: inState, the state of the game
   * Output: whichPlayer, P1 or P2, so that I can know look for min or max
   */
  function checkWhichPlayer(state: State): WhichPlayer {
    const status = game.gameStatus(state);
    if (status.tag === 'Draw') throw new Error('error: game over');
    return status.player;
  }

  /* nextMovePathStatePair:
   * Input: inState;
   * Output: list((movePath, state)). next step's move and the corresponding state
   */
  function nextMovePathStatePair(state: State): [MovePath, State][] {
    const nextLegalMoves = game.legalMoves(state).map(move => [move]);
    const nextStates = nextLegalMoves.map(movePath => game.nextState(state, movePath[0]));
    return pair2lists(nextLegalMoves, nextStates);
  }

  function pairToState(pair: [MovePath, State]): State {
    return pair[1];
  }

  /* bottomState:
   * Input: inState, depth;
   * Output: list((movePath, state)).
   */
  function bottomState(state: State, depth: number): [MovePath, State][] {
    if (depth === 1) {
      return [[[], state]];
    }
    const previousMovePathState = bottomState(state, depth - 1);
    const chainedPairTree = previousMovePathState.map(prePair => {
      const [preMovePath, preState] = prePair;
      const nextPairs = nextMovePathStatePair(preState);
      return nextPairs.map(([newMovePath, newState]) => {
        return [preMovePath.concat(newMovePath), newState] as [MovePath, State];
      });
    });
    return chainedPairTree.flat();
  }

  /* minimax:
   * Input: s, depth;
   * Output: move. find the best move based on the state and the depth
   */
  function minimax(state: State, depth: number): Move {
    if (depth === 1) throw new Error('error: cannot look for itself');
    const bottomStates = bottomState(state, depth);
    const bottomEstVals = bottomStates.map(([movePath, s]) => {
      return [movePath, game.estimateValue(s)] as [MovePath, number];
    });
    const bestPath =
      checkWhichPlayer(state) === 'P1'
        ? lookUpMax(bottomEstVals)
        : lookUpMin(bottomEstVals);
    return bestPath[0];
  }

  function nextMove(state: State): Move {
    return minimax(state, 3);
  }

  return {
    playerGame: game,
    nextMove,
    playerName: name,
  };
}
