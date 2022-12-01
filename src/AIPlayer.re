open! CS17SetupGame;
open Game;

module AIPlayer = (MyGame: Game) => {
  module PlayerGame = MyGame; // Connect4
  /* TODO */
  open PlayerGame;
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
  let checkWhichPlayer: PlayerGame.state => PlayerGame.whichPlayer =
    inState =>
      switch (inState) {
      | State(Ongoing(player), _) => player //? how to tell if now it's P1 or P2
      | _ => failwith("error: checkWhichPlayer")
      };
  let nextMove: PlayerGame.state => PlayerGame.move =
    s => {
      /* simple version;
         List.hd(PlayerGame.legalMoves(s));*/
      let nextLegalMoves: list(move) = PlayerGame.legalMoves(s); // get all the legal moves
      let nextStates: list(state) =
        List.map(move => PlayerGame.nextState(s, move), nextLegalMoves); // eval the next state
      let nextEstValues: list(float) =
        List.map(state => PlayerGame.estimateValue(state), nextStates); // eval the estimated value
      let nextMoveVal: list((move, float)) =
        pair2lists(nextLegalMoves, nextEstValues); // pair the move with the float value

      lookUpMin(nextMoveVal); // now in R3Human2AI.playGame() the AI is P2
    };

  /* put your team name here! */
  let playerName = "";
};

module TestGame = Connect4.Connect4;
open Player;

module TestAIPlayer = AIPlayer(TestGame);
module MyAIPlayer: Player = TestAIPlayer; //ensure the AIPlayer module implements the Player signature
open TestAIPlayer;

/* insert test cases for any procedures that don't take in
 * or return a state here */
