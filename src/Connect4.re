/* Yihao (George) Xu -- yxu265*/
open! CS17SetupGame;
open Game;

module Connect4 = {
  /* player 1 is P1, player 2 is P2 */
  type whichPlayer =
    | P1
    | P2;

  /* either a player has won, it's a draw, or it's ongoing */
  type status =
    | Win(whichPlayer)
    | Draw
    | Ongoing(whichPlayer);

  type place =
    | Red
    | Yellow
    | None;
  let stringOfPlace =
    fun
    | Red => "\027[31m--Red---\027[0m"
    | Yellow => "\027[33m-Yellow-\027[0m"
    | None => "\027[32m--None--\027[0m";
  type matrix = list(list(place)); //int; new type
  // matrix pro
  let horzFlip: matrix => matrix = matrixIn => List.rev(matrixIn);
  let rec transpose: matrix => matrix =
    matrixIn =>
      switch (matrixIn) {
      /*error case*/
      | []
      | [[], ..._] => failwith("A matrix cannot be 0-dimensional")
      /*Base Case: list of one-element lists. hd is the last*/
      | [[hd], ..._] => [List.flatten(matrixIn)]
      /* recursive case: list of longer lists.
         I found myself hard to use the 'hd' 'tl', and I used List.hd List.tl instead in lambda :(*/
      | [[hd, ...tl], ..._] => [
          List.map(elelst => List.hd(elelst), matrixIn),
          ...transpose(List.map(elelst => List.tl(elelst), matrixIn)),
        ]
      };
  let rec mainDiagonal: matrix => list('a) =
    inMatrix =>
      switch (inMatrix) {
      | [[item], ..._] => [item]
      | [[item, ..._]] => [item]
      | [[hd00, ..._], ...tl] => [
          hd00,
          ...mainDiagonal(List.map(List.tl, tl)),
        ]
      | _ => failwith("error_mainDiagonal")
      };

  let rec halfNW2SEDiagonal: matrix => matrix =
    inMatrix =>
      switch (inMatrix) {
      | [[item, ..._]] => [[item]]
      | [[_, ..._], ...tl] => [
          mainDiagonal(inMatrix),
          ...halfNW2SEDiagonal(tl),
        ]
      | _ => failwith("error_halfNW2SEDiagonal")
      };

  let allDiagonal: matrix => matrix =
    inMatrix =>
      halfNW2SEDiagonal(inMatrix)
      @ halfNW2SEDiagonal(transpose(inMatrix))
      @ halfNW2SEDiagonal(horzFlip(inMatrix))
      @ halfNW2SEDiagonal(transpose(horzFlip(inMatrix)));
  type state =
    | State(status, matrix);

  type move =
    | Move(int);
  /* the int here stands for the coloum,
   * which the player would place the block into.
   * since here the legal move will not be checked,
   * here, int can be negative, zero or positive.
   */

  let stringOfPlayer: whichPlayer => string =
    input =>
      switch (input) {
      | P1 => "Player1(Red)"
      | P2 => "Player2(Yellow)"
      };

  let stringOfMatrix: matrix => string = {
    let stringOfListPlace: list(place) => string =
      alop =>
        "|"
        ++ List.fold_right(
             (str0, str1) => str0 ++ str1,
             List.map(stringOfPlace, alop),
             "",
           )
        ++ "|\n";
    inMatrix =>
      List.fold_right(
        (str0, str1) => str0 ++ str1,
        List.map(stringOfListPlace, transpose(inMatrix)),
        "",
      );
  };

  let stringOfState: state => string =
    fun
    | State(inStatus, inMatrix) =>
      switch (inStatus) {
      | Win(inPlayer) =>
        stringOfPlayer(inPlayer) ++ "wins. \n" ++ stringOfMatrix(inMatrix)
      | Draw => "Game: Draw" ++ stringOfMatrix(inMatrix)
      | Ongoing(inPlayer) =>
        "Game is ongoing. It's "
        ++ stringOfPlayer(inPlayer)
        ++ "'s turn. \n"
        ++ stringOfMatrix(inMatrix)
      };

  let stringOfMove: move => string =
    fun
    | Move(inNum) =>
      "The player move in No." ++ string_of_int(inNum) ++ " column";

  let otherPlayer: whichPlayer => whichPlayer =
    fun
    | P1 => P2
    | P2 => P1;
  let initialState: string => state =
    s => {
      let boardDims = parseBoardDims(s);
      let boardHeight: int = getBoardHeight(boardDims);
      let boardWidth: int = getBoardWidth(boardDims);
      /* repeatList:
       * Input: (elem, num). an element of any type and a posstive integar
       * Output: a list of elem with the length of num
       */
      let rec repeatList: 'a. ('a, int) => list('a) =
        (elem, num) =>
          switch (num) {
          | 1 => [elem]
          | n => [elem, ...repeatList(elem, n - 1)]
          };
      /*let columnsPlaceHolder: list(place) = repeatList(None, boardWidth);
        let initMatrix: matrix =
          List.map(element => repeatList(None, boardHeight), columnsPlaceHolder);
        Js.log(initMatrix);*/
      let emptyColumn: list(place) = repeatList(None, boardHeight);
      let initMatrix: matrix = repeatList(emptyColumn, boardWidth);
      State(
        Ongoing(P1),
        initMatrix // ''Q'' Is a proc in a proc allowed?
      );
      /* your initial state, using boardHeight and boardWidth, goes here */
    };

  let legalMoves: state => list(move) =
    inState => {
      /* legalMovesHelper:
       * Input: matrix, 0
       * Output: a list of integar
       * if the head of the list element in the matrix is zero, this list element is the legal place to put in block
       */
      let rec legalMovesHelper: (matrix, int) => list(int) =
        (inMatrix, num) =>
          switch (inMatrix, num) {
          | ([[hd, ..._]], n) =>
            if (hd == None) {
              [n];
            } else {
              [];
            }
          | ([[hd, ..._], ...tail], n) =>
            if (hd == None) {
              [n, ...legalMovesHelper(tail, n + 1)];
            } else {
              legalMovesHelper(tail, n + 1);
            }
          | _ => failwith("error: should input a matrix")
          };
      switch (inState) {
      | State(_, inMatrix) =>
        List.map(intElem => Move(intElem), legalMovesHelper(inMatrix, 0))
      };
    };

  let gameStatus: state => status =
    inState => {
      let State(p, _) = inState;
      p;
    };

  let rec findNReplaceLastNoneInAColumn:
    (list(place), whichPlayer) => list(place) =
    (alop, inplayer) =>
      switch (alop, inplayer) {
      | ([None], inplayer) => inplayer == P1 ? [Red] : [Yellow]
      | ([hd, ...tl], inplayer) =>
        if (hd == None && List.hd(tl) != None) {
          inplayer == P1 ? [Red, ...tl] : [Yellow, ...tl];
        } else if (hd == None && List.hd(tl) == None) {
          [None, ...findNReplaceLastNoneInAColumn(tl, inplayer)];
        } else {
          failwith("error: column is full. cannot put in");
        }
      | ([], _) => failwith("error: init matrix error. No empty matrix")
      };

  let rec nextStateHelper: (matrix, int, whichPlayer) => matrix =
    (inMatrix, inNum, whichPlayer) =>
      switch (inMatrix, inNum, whichPlayer) {
      | ([[None]], 0, inplayer) => inplayer == P1 ? [[Red]] : [[Yellow]]
      | ([colHd, ...colTl], 0, inplayer) => [
          findNReplaceLastNoneInAColumn(colHd, inplayer),
          ...colTl,
        ]
      | ([colHd, ...colTl], num, inplayer) =>
        [colHd] @ nextStateHelper(colTl, num - 1, inplayer)
      | _ => failwith("error: nextStateHelper")
      };

  let nextState: (state, move) => state = {
    let rec isCloneList: list('a) => bool =
      fun
      | []
      | [_] => false
      | [hd0, hd1] => hd0 == hd1
      | [hd0, hd1, ...tl] => hd0 == hd1 && isCloneList(tl)
      | _ => failwith("error: checkCloneList");
    /* --- check win --- */
    let isChainInAMatrix: (matrix, place) => bool = {
      let rec isChainInAColumn: (list(place), place) => bool =
        (inColumn, inPlace) =>
          switch (inColumn) {
          | []
          | [_]
          | [_, _]
          | [_, _, _] => false
          | [color0, _, _, _] => color0 == inPlace && isCloneList(inColumn)
          // | [Red,Red,Red,Red,...tl] => true
          | [color0, color1, color2, color3, ..._] =>
            if (color0 == inPlace) {
              isCloneList([color0, color1, color2, color3])
              || isChainInAColumn(List.tl(inColumn), inPlace);
            } else {
              isChainInAColumn(List.tl(inColumn), inPlace);
            }
          }; // end isChainInAColum
      let rec isChainInAMatrixRough: (matrix, place) => bool =
        (inMatrix, inplace) =>
          switch (inMatrix, inplace) {
          | ([aCol], inplace) => isChainInAColumn(aCol, inplace)
          | ([colHd, ...coltl], inplace) =>
            isChainInAColumn(colHd, inplace)
            || isChainInAMatrixRough(coltl, inplace)
          | _ => failwith("error: isChainInAMatrixRough")
          };
      (inMatrix, inplace) =>
        //vertical chain
        isChainInAMatrixRough(inMatrix, inplace)
        //horizon chain
        || isChainInAMatrixRough(transpose(inMatrix), inplace);
      //diagonal chain
      //|| isChainInAMatrixRough(allDiagonal(inMatrix), inplace);
    };
    // end isChainInAMatrix
    let checkWin: state => bool =
      fun
      | State(Ongoing(inplayer), inMatrix) =>
        switch (inplayer) {
        | P1 => isChainInAMatrix(inMatrix, Red)
        | P2 => isChainInAMatrix(inMatrix, Yellow)
        }
      | _ => failwith("error: checkWin");
    /* --- End of check win --- */
    (inState, inMove) =>
      switch (inState, inMove) {
      | (State(Win(_), _), _)
      | (State(Draw, _), _) => inState
      | (State(Ongoing(inPlayer), inMatrix), Move(noOfCol)) =>
        let newMatrix: matrix = nextStateHelper(inMatrix, noOfCol, inPlayer);
        if (checkWin(State(Ongoing(inPlayer), newMatrix))) {
          // got a winner. test on the next step before update the print
          State(
            Win(inPlayer),
            newMatrix,
          );
        } else if (!List.mem(None, List.flatten(inMatrix))) {
          // no winner and the board is Full => Draw
          State(
            Draw,
            nextStateHelper(inMatrix, noOfCol, inPlayer),
          );
        } else {
          // no winner and no full => keep going
          State(
            Ongoing(otherPlayer(inPlayer)),
            nextStateHelper(inMatrix, noOfCol, inPlayer),
          );
        };
      };
  };

  //checking legal moves here
  let moveOfString: (string, state) => move =
    (str, myState) => {
      let mov =
        try(Move(int_of_string(str) - 1)) {
        | _ => failwith("error: illegal move")
        };
      if (List.mem(mov, legalMoves(myState))) {
        mov;
      } else {
        failwith("error: illegal move");
      };
    };
  let estimateValue: state => float =
    fun
    | _ => failwith("not implenmented yet");
  // TO DO
};

module MyGame: Game = Connect4;
open Connect4; /*Q: What's this open Connect4 for? */

/* test cases */
/* Estimated Value
  * First, check each column in the matrix to see how many unblocked 3-element chains
  * Second, transpose the matrix and do the same as the first step
  * in diagonal directions...which would be more complicated, but can be done
  * by wrapping each column with a arithmetic progression, smiliar to Caesar cipher
  * (
  *  but this method has a BUG: some not continous case will be counted.
  *  0 0 0
  *  1 0 0
  *  0 0 1
  *  if we looking for two-element chain, in this case the result will be 1.
  * but actually should be 0
  * win state 100...
  * )
  * and do the same as the first step
  * and wrapping the transposed matrix,... do the same as the first step
  * Add all the four condition results together
  * if there are two or more, then this a certain win or lose condition. the value will be HUGE
  *
  * Q: Which procedures in your Connect4 module will the AI player use? Why?
  * A: legalMoves (the move of the AI must be legal) ->  nextMove (check for the estimated value and minimax) -> nextState (then it's the otherplayer's turn)
  *
  * Q: What should the AI player do if there are no legal moves available? If you don’t think this should ever happen, tell us why not.
  * A: If this situation occurs, it means that the board is full. In other words, the game over and the result, the status, will be draw.
  *
  * Q: How does your AI player take into account the fact that the other player wants the AI player to lose?
  * Does your strategy work even if two AI players are playing against each other?
  * A: in the minimax, the AI player will try to go to the max or min value subpath, which is just opposite of the emeny.
  * (I believe it will work)
  *
  * Q: How does the HumanPlayer code work? What does it rely on? You will be asked to walk the TA
 through a brief explanation of the HumanPlayer code to prove that you understand it.
  * A: {in Referee.re} R1.playGame() -> if OnGoing -> Player1.nextMove(s)
  *    {in HumanPlayer.re} getInputJSLine() -> try ( -> err, and go back to nextMove(s))
  *
  * Q: How does the Referee code work? Like with HumanPlayer, you’ll be asked to walk the TA through a brief explanation of the Referee code to prove that you understand it.
  * A: First define the module Referee, which will be implement at the end.
  *    Line48, a new module RI is defined (constructed), meaning a game called Connect4.Connect4 will be playerd by 2 AI player.
  *    R1.playGame() is called, no arugment passes in.
  *    in the gameLoop, first check the stop (base) case, Win / Draw
  *    if ongoing, then AIPlayer.nextMove() ... (complicated stuff)
  *    LOOP until the stop case
  */
