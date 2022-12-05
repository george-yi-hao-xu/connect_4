open! CS17SetupGame;
open Game;

module AIPlayer = (MyGame: Game) => {
  module PlayerGame = MyGame; // Connect4
  /* TODO */
  open PlayerGame;
  type movePath = list(PlayerGame.move);

  /*  pair2lists
   *  Input: listA with type list('a), listB with type list('b)
   *  Output: a list of pairs. Each pair has the type ('a,'b)
   */
  let rec pair2lists: (list('a), list('b)) => list(('a, 'b)) =
    (listA, listB) =>
      switch (listA, listB) {
      | ([], []) => []
      | ([itemA], [itemB]) => [(itemA, itemB)]
      | ([hdA, ...tlA], [hdB, ...tlB]) => [
          (hdA, hdB),
          ...pair2lists(tlA, tlB),
        ]
      | _ => failwith("error: pair2lists")
      };
  checkExpect(
    pair2lists(["Tom", "Jacky", "John"], [1.0, 2.0, 3.0]),
    [("Tom", 1.0), ("Jacky", 2.0), ("John", 3.0)],
    "check for pair2lists 01 (AIPlayer)",
  );

  /* lookUpMax:
   * Input: alop, a list of pairs, with type('a, float)
   * Output: 'a, the item w/ largets float number
   */
  let lookUpMax: list(('a, float)) => 'a = {
    let rec lookUpMaxHelper: (list(('a, float)), 'a, float) => 'a =
      (alop, item, inNumf) =>
        switch (alop) {
        | [] => failwith("Error: cannot lookUpMax in ")
        | [(oneItem, oneNumf)] => oneNumf > inNumf ? oneItem : item
        | [(hdItem, hdNumf), ...tl] =>
          if (hdNumf < inNumf) {
            lookUpMaxHelper(tl, item, inNumf);
          } else {
            lookUpMaxHelper(tl, hdItem, hdNumf);
          }
        };
    alop =>
      switch (alop) {
      | [] => failwith("Error: cannot lookUpMax in ")
      | [(item, numf), ..._] => lookUpMaxHelper(alop, item, numf)
      };
  };
  checkExpect(
    lookUpMax([("Tom", 4.0), ("Jacky", 2.0), ("John", 3.0)]),
    "Tom",
    "check for lookUpMax in AIPlayer",
  );

  /* lookUpMin:
   * Input: alop, a list of pairs, with type('a, float)
   * Output: 'a, the item w/ smallest float number
   */
  let lookUpMin: list(('a, float)) => 'a =
    inalop => {
      let oppositeNumfList: list(('a, float)) =
        List.map(
          element => {
            switch (element) {
            | (item, numf) => (item, 0.0 -. numf)
            }
          },
          inalop,
        );
      lookUpMax(oppositeNumfList);
    };
  checkExpect(
    lookUpMin([("Tom", 4.0), ("Jacky", 2.0), ("John", 3.0)]),
    "Jacky",
    "check for lookUpMin in AIPlayer",
  );

  /* checkWhichPlayer:
   * Input: inState, the state of the game
   * Output: whichPlayer, P1 or P2, so that I can know look for min or max
   */
  let checkWhichPlayer: PlayerGame.state => PlayerGame.whichPlayer =
    inState =>
      switch (PlayerGame.gameStatus(inState)) {
      | Ongoing(currentPlayer) => currentPlayer
      | Win(currentPlayer) => currentPlayer
      | Draw => failwith("error: game over")
      };

  /* nextAllLegalMovesVal:
   * Input: inState;
   * Output: list((PlayerGame.move, float)). next step's move and the corresponding estimated value
   *  type movePath = list(PlayerGame.move);
   */
  let nextMovePathStatePair:
    PlayerGame.state => list((movePath, PlayerGame.state)) =
    s => {
      /* simple version;
         List.hd(PlayerGame.legalMoves(s));*/
      let nextLegalMoves: list(movePath) =
        List.map(elem => [elem], PlayerGame.legalMoves(s)); // get all the legal moves
      let nextStates: list(state) =
        List.map(
          movePath => PlayerGame.nextState(s, List.hd(movePath)),
          nextLegalMoves,
        ); // get the next state; this is emeny's value
      // let nextEstValues: list(float) = List.map(state => PlayerGame.estimateValue(state), nextStates); // get the estimated value
      let nextMovePathState: list((movePath, state)) =
        pair2lists(nextLegalMoves, nextStates); // pair the move with the float value
      nextMovePathState;
    };

  let pairToState: ((movePath, PlayerGame.state)) => PlayerGame.state =
    input =>
      switch (input) {
      | (_, s) => s
      };

  /* bottomValues:
   * Input: inState, depth;
   * Output: list((movePath, PlayerGame.state)).
   */
  let rec bottomState:
    (PlayerGame.state, int) => list((movePath, PlayerGame.state)) = {
    // helper proc
    /* chainMovePathStatePair:
     * Input: pair, pair;
     * Output: pair. ignore the previous state and chain the movePath
     */
    let chainMovePathStatePair:
      ((movePath, PlayerGame.state), (movePath, PlayerGame.state)) =>
      (movePath, PlayerGame.state) =
      (previousMovePathState, newNextMovePathStatePair) =>
        switch (previousMovePathState, newNextMovePathStatePair) {
        | ((preMovePathHd, _), (newMovePathHd, newStateHd)) => (
            preMovePathHd @ newMovePathHd,
            newStateHd,
          )
        };
    (inState, depth) =>
      switch (depth) {
      | 1 => [([], inState)] // list((movePath, PlayerGame.state))
      | n =>
        let previousMovePathState: list((movePath, PlayerGame.state)) =
          bottomState(inState, n - 1); //RO
        // help proc
        /* chainPreNewMovePathState:
         * Input: pair, list(pair);
         * Output: list(pair).
         */
        let chainPreNewMovePathState:
          (
            (movePath, PlayerGame.state),
            list((movePath, PlayerGame.state))
          ) =>
          list((movePath, PlayerGame.state)) = (
          (prePair, alop) =>
            List.map(
              newPair => chainMovePathStatePair(prePair, newPair),
              alop,
            )
        );
        // like [([L, ???], [R, ???])]
        // let newLegalMoves: list(move) = PlayerGame.legalMoves(inState);
        let chainedPairTree: list(list((movePath, PlayerGame.state))) =
          List.map(
            prePair =>
              chainPreNewMovePathState(
                prePair,
                nextMovePathStatePair(pairToState(prePair)) // list of list
              ),
            previousMovePathState,
          );
        List.flatten(chainedPairTree); // end case n
      }; // end switch case
  }; // end bottom value

  /* minimax:
   * Input: s, depth;
   * Output: move. find the best move based on the state and the depth
   */
  let minimax: (PlayerGame.state, int) => PlayerGame.move =
    (s, depth) =>
      switch (depth) {
      | 1 => failwith("error: cannot look for itself") // itself? no value
      | _ =>
        let thisBottomState: list((movePath, PlayerGame.state)) =
          bottomState(s, depth);
        // convert from (movePath, state) to (movePath, float)
        let thisBottomEstval: list((movePath, float)) =
          List.map(
            pair => {
              switch (pair) {
              | (movePath, state) => (
                  movePath,
                  PlayerGame.estimateValue(state),
                )
              }
            },
            thisBottomState,
          );
        switch (checkWhichPlayer(s)) {
        | P1 => List.hd(lookUpMax(thisBottomEstval))
        // list((movePath, float)) -> movePath (list(move)) -> move
        | P2 => List.hd(lookUpMin(thisBottomEstval))
        }; // end switch case on checkWhichPlayer(s)
      // end case n => ...
      // in the end, get the best movePATH, but just need get the List.hd(movePath)
      }; // end switch case on the input

  let nextMove: PlayerGame.state => PlayerGame.move = s => minimax(s, 3); // miniman w/ depth of 3
  /* put your team name here! */
  let playerName = "TopG";
};

module TestGame = Connect4.Connect4;
open Player;

module TestAIPlayer = AIPlayer(TestGame);
module MyAIPlayer: Player = TestAIPlayer; //ensure the AIPlayer module implements the Player signature
open TestAIPlayer;

/* insert test cases for any procedures that don't take in
 * or return a state here */
