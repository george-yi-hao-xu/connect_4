import type { Game, Player, PlayerName, WhichPlayer } from './types';

export function create_AI_player<S, M>(
  game: Game<S, M>,
  name: PlayerName,
  delay = 0,
  random = Math.random,
): Player<S, M> {
  type MovePath = M[];

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
   * Output: 'a, one of the items w/ largest float number, chosen uniformly at random
   */
  function lookup_max<T>(pairs: [T, number][]): T {
    if (pairs.length === 0) throw new Error('Error: cannot lookUpMax in ');
    let bestVal = pairs[0][1];
    const bestItems: T[] = [];

    for (const [item, val] of pairs) {
      if (val > bestVal) {
        bestVal = val;
        bestItems.length = 0; // clear
        bestItems.push(item);
      } else if (val === bestVal) {
        bestItems.push(item);
      }
    }

    // if meet multi candidates, like no winning case or multi winning case, ran select one
    return bestItems[Math.floor(random() * bestItems.length)];
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
  function checkWhichPlayer(state: S): WhichPlayer {
    const status = game.get_game_status(state);
    if (status.tag === 'Draw') throw new Error('error: game over');
    return status.player;
  }

  /* nextMovePathStatePair:
   * Input: inState;
   * Output: list((movePath, state)). next step's move and the corresponding state
   */
  function get_all_next_move_path(state: S): [MovePath, S][] {
    const status = game.get_game_status(state);
    const next_legal_moves = game.get_legal_moves(state).map(move => [move]);
    const next_states = next_legal_moves.map(movePath => game.get_next_state(state, movePath[0]));
    const pairs = pair_to_lists(next_legal_moves, next_states);

    if (status.tag !== 'Ongoing') return pairs;

    // sort
    return pairs
      .map(([move_path, next_state]) => ({
        move_path,
        next_state,
        score: game.get_score(next_state),
      }))
      .sort((a, b) =>
        status.player === 'P1'
          ? b.score - a.score
          : a.score - b.score,
      )
      .map(({ move_path, next_state }) => [move_path, next_state]);
  }

  function score_finished_state(state: S, depth: number): number {
    const score = game.get_score(state);
    if (score > 0) return score + depth;
    if (score < 0) return score - depth;
    return score;
  }

  function this_player_is_going_to_win(state: S): boolean {
    const status = game.get_game_status(state);
    if (status.tag !== 'Ongoing') return false;

    return game.get_legal_moves(state).some((move) => {
      const next_state = game.get_next_state(state, move);
      const next_status = game.get_game_status(next_state);
      return next_status.tag === 'Win' && next_status.player === status.player;
    });
  }

  /* minimax:
   * Input: s, depth;
   * Output: move. find the best move based on the state and the depth
   */
  function best_path_score_recur(state: S, depth: number, alpha: number, beta: number): number {
    const status = game.get_game_status(state);

    // Prefer faster wins and slower losses when terminal states have the same base score.
    if (status.tag !== 'Ongoing') return score_finished_state(state, depth);
    if (depth === 0) return game.get_score(state);

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

  function min_i_max(state: S, depth: number): M {
    if (depth === 1) throw new Error('error: cannot look for itself');

    const current_player = checkWhichPlayer(state);
    const next_move_path_state_pairs = get_all_next_move_path(state);

    // Quickly iter, if find win, just RETURN
    for (const [move_path, next_s] of next_move_path_state_pairs) {
      const status = game.get_game_status(next_s);
      if (status.tag === 'Win' && status.player === current_player) {
        return move_path[0];
      }
    }

    // DEFENCE
    const safe_move_path_state_pairs = next_move_path_state_pairs.filter(
      ([, next_s]) => !this_player_is_going_to_win(next_s),
    );
    if (
      safe_move_path_state_pairs.length === 1 &&
      safe_move_path_state_pairs.length < next_move_path_state_pairs.length
    ) {
      return safe_move_path_state_pairs[0][0][0];
    }

    const candidate_move_path_state_pairs =
      safe_move_path_state_pairs.length > 0 &&
      safe_move_path_state_pairs.length < next_move_path_state_pairs.length
        ? safe_move_path_state_pairs
        : next_move_path_state_pairs;

    const next_scores: [MovePath, number][] = [];
    for (const [move_path, next_s] of candidate_move_path_state_pairs) {
      const score = best_path_score_recur(next_s, depth - 1, -Infinity, Infinity);
      next_scores.push([move_path, score]);
    }

    const best_path = current_player === 'P1' ? lookup_max(next_scores) : lookup_min(next_scores);
    
    return best_path[0];
  }


  // ENTRY PT; minimax depth
  async function get_next_move(state: S): Promise<M> {
    await new Promise((resolve) => setTimeout(resolve, delay));
    return min_i_max(state, 3);
  }

  return {
    game_ref: game,
    get_next_move: get_next_move,
    player_name: name,
  };
}
