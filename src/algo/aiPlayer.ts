import type { Game, Move, Player, PlayerName, State, WhichPlayer } from './types';

type MovePath = Move[];

export function create_AI_player(game: Game, name: PlayerName): Player {
  /* pair2lists
   * Input: listA with type list('a), listB with type list('b)
   * Output: a list of pairs. Each pair has the type ('a,'b)
   */
  function pair_to_lists<A, B>(listA: A[], listB: B[]): [A, B][] {
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
  function lookup_max<A>(pairs: [A, number][]): A {
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
  function lookup_min<A>(pairs: [A, number][]): A {
    const opposite = pairs.map(([item, val]) => [item, -val] as [A, number]);
    return lookup_max(opposite);
  }

  /* checkWhichPlayer:
   * Input: inState, the state of the game
   * Output: whichPlayer, P1 or P2, so that I can know look for min or max
   */
  function checkWhichPlayer(state: State): WhichPlayer {
    const status = game.get_game_status(state);
    if (status.tag === 'Draw') throw new Error('error: game over');
    return status.player;
  }

  /* nextMovePathStatePair:
   * Input: inState;
   * Output: list((movePath, state)). next step's move and the corresponding state
   */
  function get_all_next_move_path(state: State): [MovePath, State][] {
    const next_legal_moves = game.get_legal_moves(state).map(move => [move]);
    const next_states = next_legal_moves.map(movePath => game.get_next_state(state, movePath[0]));
    return pair_to_lists(next_legal_moves, next_states);
  }

  // function pairToState(pair: [MovePath, State]): State {
  //   return pair[1];
  // }

  // /* bottomState:
  //  * Input: inState, depth;
  //  * Output: list((movePath, state)).
  //  */
  // function bottom_state(state: State, depth: number): [MovePath, State][] {
  //   if (depth === 1) {
  //     return [
  //       [[], state]
  //     ];
  //   }

  //   const previous = bottom_state(state, depth - 1);
    
  //   const one_lv_deeper = previous.map(pair => {
  //     const [pre_path, pre_state] = pair;
  //     const next = get_all_next_move_path(pre_state);
  //     return next.map(([new_move_path, new_state]) => {
  //       return [[...pre_path,...new_move_path], new_state] as [MovePath, State];
  //     });
  //   });

  //   return one_lv_deeper.flat();
  // }

  /* minimax:
   * Input: s, depth;
   * Output: move. find the best move based on the state and the depth
   */
  function best_path_score_recur(state: State, depth: number, alpha: number, beta: number): number {
    const status = game.get_game_status(state);

    if (depth === 0 || status.tag !== 'Ongoing') return game.get_score(state);

    const next_states = get_all_next_move_path(state);
    if (next_states.length === 0) return game.get_score(state);

    if (status.player === 'P1') {
      let best_score = -Infinity;
      for (const [, s] of next_states) {
        best_score = Math.max(best_score, best_path_score_recur(s, depth - 1, alpha, beta));
        alpha = Math.max(alpha, best_score);
        if (beta <= alpha) break;
      }
      return best_score;
    }
  
    // If here is P2 MIN player, then the top one is a MAX
    // alpha is the BEST value the MAX player can guarantee (like from the left branch, guarded by MIN) SO FAR
    // If a score here found (beta) is even lower
    // this branch will never be chosen, so prune it.
    let best_score = Infinity;
    for (const [, s] of next_states) {
      best_score = Math.min(best_score, best_path_score_recur(s, depth - 1, alpha, beta));
      beta = Math.min(beta, best_score); // lowest in curr branch
      // prevent reaching this low branch, break!
      if (beta <= alpha) break;
    }
    return best_score;
  }

  function min_i_max(state: State, depth: number): Move {
    if (depth === 1) throw new Error('error: cannot look for itself');

    const current_player = checkWhichPlayer(state);
    const next_scores: [MovePath, number][] = [];
    let alpha = -Infinity;
    let beta = Infinity;

    for (const [movePath, next_s] of get_all_next_move_path(state)) {
      const score = best_path_score_recur(next_s, depth - 1, alpha, beta);
      next_scores.push([movePath, score]);

      if (current_player === 'P1') {
        alpha = Math.max(alpha, score);
      } else {
        beta = Math.min(beta, score);
      }
    }

    const bestPath = current_player === 'P1' ? lookup_max(next_scores) : lookup_min(next_scores);
    
    return bestPath[0];
  }


  // ENTRY PT; minimax depth
  async function get_next_move(state: State): Promise<Move> {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return min_i_max(state, 3);
  }

  return {
    game_ref: game,
    get_next_move: get_next_move,
    player_name: name,
  };
}
