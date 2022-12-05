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
  /* stringOfPlace:
   * Input: place, Red or Yellow or None
   * Output: corroesponding string of each place
   */
  let stringOfPlace =
    fun
    | Red => "\027[31m--Red---\027[0m"
    | Yellow => "\027[33m-Yellow-\027[0m"
    | None => "\027[32m--None--\027[0m";
  type matrix = list(list(place));
  // matrix proc
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
      | [[_, ..._], ..._] => [
          List.map(elelst => List.hd(elelst), matrixIn),
          ...transpose(List.map(elelst => List.tl(elelst), matrixIn)),
        ]
      };
  checkExpect(
    transpose([[Red, Red], [Yellow, Yellow], [None, None]]),
    [[Red, Yellow, None], [Red, Yellow, None]],
    "testing for transposing a matrix",
  );
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
  /* halfNW2SEDiagonal:
   * Input: inMatrix, a matrix
   * Output: the diagonal list from NW to SE, but only the half of the matrix
   */
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
  /* hallDiagonal:
   * Input: inMatrix, a matrix
   * Output: the diagonal list in all conditions
   */
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

  let rec getHds: (list('a), int) => list('a) =
    (aloa, num) =>
      switch (num) {
      | 0 => []
      | n => [List.hd(aloa), ...getHds(List.tl(aloa), n - 1)]
      };
  checkExpect(getHds([0, 1, 2, 3], 2), [0, 1], "checking getHds");
  let rec cullHds: (list('a), int) => list('a) =
    (aloa, num) =>
      switch (num) {
      | 0 => aloa
      | n => cullHds(List.tl(aloa), n - 1)
      };
  checkExpect(cullHds([0, 1, 2, 3], 2), [2, 3], "checking cullHds");
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
      "The player move in No." ++ string_of_int(inNum + 1) ++ " column";

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
  /* findNReplaceLastNoneInAColumn:
   * Input: alop, inplayer. a column, aka a list of place, and a player
   * Output: a column, aka a list of place, but the last None was replaced
   */
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
  /* Testing Case: findNReplaceLastNoneInAColumn */
  checkExpect(
    findNReplaceLastNoneInAColumn([None, None, Red], P1),
    [None, Red, Red],
    "check for findNReplaceLastNoneInAColumn 01",
  );
  checkExpect(
    findNReplaceLastNoneInAColumn([None, None, Red], P2),
    [None, Yellow, Red],
    "check for findNReplaceLastNoneInAColumn 02",
  );
  checkExpect(
    findNReplaceLastNoneInAColumn([None, None, None], P1),
    [None, None, Red],
    "check for findNReplaceLastNoneInAColumn 03",
  );
  /* isCloneList:
   * Input: aloa. any kind of list
   * Output: bool. if all the elements in the list are same, then true. else, false
   */
  let rec isCloneList: list('a) => bool =
    fun
    | []
    | [_] => false
    | [hd0, hd1] => hd0 == hd1
    | [hd0, hd1, ...tl] => hd0 == hd1 && isCloneList([hd1, ...tl]);
  /*Testing Case:  isCloneList*/
  checkExpect(isCloneList([1, 1, 1, 1]), true, "check for isCloneList 01");
  checkExpect(isCloneList([1, 1, 0, 1]), false, "check for isCloneList 02");
  /* isChainInAColumn:
   * Input: (inColumn, inPlace). a list of place and the place(color)
   * Output: bool. if a chain in certain color was found in the column, then true. Else, false.
   */
  let rec isChainInAColumn: (list(place), place, int) => bool =
    (inColumn, inPlace, chainNum) =>
      if (List.length(inColumn) < chainNum) {
        false;
      } else if
        // | [Red,Red,Red,Red,...tl] => true
        (List.hd(inColumn) == inPlace) {
        isCloneList(getHds(inColumn, chainNum))
        || isChainInAColumn(List.tl(inColumn), inPlace, chainNum);
      } else {
        isChainInAColumn(List.tl(inColumn), inPlace, chainNum);
      }; // end isChainInAColum
  /* Testing Case: isChainInAColumn */
  checkExpect(
    isChainInAColumn([None, None, None], Red, 4),
    false,
    "check for isChainInAColumn",
  );
  let rec countOpenChainInAColumn: (list(place), place, int) => int =
    (inColumn, inPlace, chainNum) =>
      if (List.length(inColumn) < chainNum) {
        0;
      } else if
        // | [Red,Red,Red,Red,...tl] => true
        (List.hd(inColumn) == inPlace
         && isCloneList(getHds(inColumn, chainNum))) {
        //+ countChainInAColumn(cullHds(inColumn, chainNum), inPlace, chainNum);
        1
        + countOpenChainInAColumn(
            cullHds(inColumn, chainNum),
            inPlace,
            chainNum,
          );
      } else {
        countOpenChainInAColumn(List.tl(inColumn), inPlace, chainNum);
      }; // end isChainInAColum

  checkExpect(
    countOpenChainInAColumn([None, Red, Red], Red, 2),
    1,
    "check for countChainInAColumn 01",
  );
  checkExpect(
    countOpenChainInAColumn([None, Red, Red, Red, Red], Red, 2),
    2,
    "check for countChainInAColumn 02",
  );
  /* isVerticalChainInAMatrix:
   * Input: (inMatrix, inplace). a matrix and the place looking for
   * Output: bool. if a vertical chain in certain color was found in the matrix, then true. Else, false.
   */
  let rec isVerticalChainInAMatrix: (matrix, place, int) => bool =
    (inMatrix, inplace, chainNum) =>
      switch (inMatrix, inplace) {
      | ([aCol], inplace) => isChainInAColumn(aCol, inplace, chainNum)
      | ([colHd, ...coltl], inplace) =>
        isChainInAColumn(colHd, inplace, chainNum)
        || isVerticalChainInAMatrix(coltl, inplace, chainNum)
      | _ => failwith("error: isChainInAMatrixRough")
      };
  /* Testing Case: isVerticalChainInAMatrix */
  checkExpect(
    isVerticalChainInAMatrix(
      [
        [None, None, None, None, Red],
        [None, None, None, None, Red],
        [None, None, None, None, Red],
        [None, None, None, None, Red],
      ],
      Red,
      4,
    ),
    false,
    "check for isVerticalChainInAMatrix",
  );
  checkExpect(
    isVerticalChainInAMatrix(
      [[None, Red, Red, Red, Red], [None, None, None, None, Red]],
      Red,
      4,
    ),
    true,
    "check for isVerticalChainInAMatrix",
  );
  checkExpect(
    isVerticalChainInAMatrix(
      [[None, Red, Red, Red, Red], [None, None, None, None, Red]],
      Yellow,
      4,
    ),
    false,
    "check for isVerticalChainInAMatrix",
  );
  let rec countOpenVerticalChainInAMatrix: (matrix, place, int) => int =
    (inMatrix, inplace, chainNum) =>
      switch (inMatrix, inplace) {
      | ([aCol], inplace) =>
        countOpenChainInAColumn(aCol, inplace, chainNum)
      | ([colHd, ...coltl], inplace) =>
        countOpenChainInAColumn(colHd, inplace, chainNum)
        + countOpenVerticalChainInAMatrix(coltl, inplace, chainNum)
      | _ => failwith("error: isChainInAMatrixRough")
      };
  checkExpect(
    countOpenVerticalChainInAMatrix(
      [[None, Red, Red, Red, Red], [None, Red, Red, Red, Red]],
      Red,
      4,
    ),
    2,
    "check for countVerticalChainInAMatrix 01",
  );
  checkExpect(
    countOpenVerticalChainInAMatrix(
      [[None, None, Red, Red, Red], [None, None, Red, Red, Red]],
      Red,
      3,
    ),
    2,
    "check for countVerticalChainInAMatrix 02",
  );
  /* isHorizontalChainInAMatrix:
   * Input: (matrix, inPlace). a matrix and the place(color)
   * Output: bool. if a horizontal chain in certain color was found in the column, then true. Else, false.
   */
  let isHorizontalChainInAMatrix: (matrix, place, int) => bool =
    (inMatrix, inplace, chainNum) =>
      isVerticalChainInAMatrix(transpose(inMatrix), inplace, chainNum);
  /* Testing Case: isHorizontalChainInAMatrix */
  checkExpect(
    isHorizontalChainInAMatrix(
      [
        [None, None, None, None, Red],
        [None, None, None, None, Red],
        [None, None, None, None, Red],
        [None, None, None, None, Red],
      ],
      Red,
      4,
    ),
    true,
    "check for isHorizontalChainInAMatrix 01",
  );
  checkExpect(
    isHorizontalChainInAMatrix(
      [
        [None, None, None, None, None],
        [None, None, None, None, Red],
        [None, None, None, None, Red],
        [None, None, None, None, Red],
      ],
      Red,
      4,
    ),
    false,
    "check for isHorizontalChainInAMatrix 02",
  );
  checkExpect(
    isHorizontalChainInAMatrix(
      [
        [None, None, None, None, None],
        [None, None, None, None, Yellow],
        [None, None, None, None, Yellow],
        [None, None, None, None, Red],
      ],
      Yellow,
      4,
    ),
    false,
    "check for isHorizontalChainInAMatrix 03",
  );
  let countHorizontalChainInAMatrix: (matrix, place, int) => int =
    (inMatrix, inplace, chainNum) =>
      countOpenVerticalChainInAMatrix(transpose(inMatrix), inplace, chainNum) /*+ countOpenVerticalChainInAMatrix(    horzFlip(transpose(inMatrix)),    inplace,    chainNum,  )*/; // since the proc only check the open to left chain, it need to check the open to right chain

  checkExpect(
    countHorizontalChainInAMatrix(
      [
        [None, None, None, None, Red],
        [None, None, None, None, Red],
        [None, None, None, None, Red],
        [None, None, None, None, Red],
      ],
      Red,
      4,
    ),
    1,
    "check for countHorizontalChainInAMatrix 01",
  );
  let isDiagonalChainInAMatrix: (matrix, place, int) => bool =
    (inMatrix, inplace, chainNum) =>
      isVerticalChainInAMatrix(allDiagonal(inMatrix), inplace, chainNum);
  checkExpect(
    isDiagonalChainInAMatrix(
      [
        [None, Red, Yellow, Yellow, Yellow],
        [None, None, Red, Yellow, Yellow],
        [None, None, None, Red, Yellow],
        [None, None, None, None, Red],
      ],
      Red,
      4,
    ),
    true,
    "check for isDiagonalChainInAMatrix 01",
  );
  checkExpect(
    isDiagonalChainInAMatrix(
      [
        [None, Red, Yellow, Yellow, Yellow],
        [None, None, Yellow, Yellow, Yellow],
        [None, None, None, Red, Yellow],
        [None, None, None, None, Red],
      ],
      Red,
      4,
    ),
    false,
    "check for isDiagonalChainInAMatrix 02",
  );
  checkExpect(
    isDiagonalChainInAMatrix(
      [
        [None, Red, Yellow, Yellow, Red],
        [None, None, Red, Red, Yellow],
        [None, None, Red, Yellow, Yellow],
        [None, Red, Yellow, Yellow, Red],
      ],
      Red,
      4,
    ),
    true,
    "check for isDiagonalChainInAMatrix 03",
  );
  let countOpenDiagonalChainInAMatrix: (matrix, place, int) => int =
    (inMatrix, inplace, chainNum) =>
      countOpenVerticalChainInAMatrix(
        allDiagonal(inMatrix),
        inplace,
        chainNum,
      );
  checkExpect(
    countOpenDiagonalChainInAMatrix(
      [
        [None, Red, Yellow, Yellow, Yellow],
        [None, None, Red, Yellow, Yellow],
        [None, None, None, Red, Yellow],
        [None, None, None, None, Red],
      ],
      Red,
      4,
    ),
    1,
    "check for countDiagonalChainInAMatrix 01",
  );
  let isChainInAMatrix: (matrix, place, int) => bool =
    (inMatrix, inplace, chainNum) =>
      //vertical chain
      isVerticalChainInAMatrix(inMatrix, inplace, chainNum)
      //horizon chain
      || isHorizontalChainInAMatrix(inMatrix, inplace, chainNum)
      //diagonal chain
      || isDiagonalChainInAMatrix(inMatrix, inplace, chainNum);

  let countOpenChainInAMatrix: (matrix, place, int) => int =
    (inMatrix, inplace, chainNum) =>
      //vertical chain
      countOpenVerticalChainInAMatrix(inMatrix, inplace, chainNum)
      //horizon chain
      + countHorizontalChainInAMatrix(inMatrix, inplace, chainNum)
      //diagonal chain
      + countOpenDiagonalChainInAMatrix(inMatrix, inplace, chainNum);

  let rec nextStateHelper: (matrix, int, whichPlayer) => matrix =
    (inMatrix, inNum, whichPlayer) =>
      switch (inMatrix, inNum, whichPlayer) {
      | ([[None]], 0, inplayer) => inplayer == P1 ? [[Red]] : [[Yellow]]
      | ([colHd, ...colTl], 0, inplayer) => [
          findNReplaceLastNoneInAColumn(colHd, inplayer),
          ...colTl,
        ]
      | ([colHd, ...colTl], num, inplayer) => [
          colHd,
          ...nextStateHelper(colTl, num - 1, inplayer),
        ]
      | _ => failwith("error: nextStateHelper")
      };
  /* Testing Case: nextStateHelper */
  checkExpect(
    nextStateHelper([[None, Red], [None, Yellow]], 0, P1),
    [[Red, Red], [None, Yellow]],
    "check for nextStateHelper 01",
  );
  checkExpect(
    nextStateHelper([[None, Red], [None, Yellow]], 1, P2),
    [[None, Red], [Yellow, Yellow]],
    "check for nextStateHelper 02",
  );
  checkExpect(
    nextStateHelper(
      [
        [None, None, Yellow, Red],
        [None, None, None, None],
        [None, None, None, None],
      ],
      1,
      P1,
    ),
    [
      [None, None, Yellow, Red],
      [None, None, None, Red],
      [None, None, None, None],
    ],
    "check for nextStateHelper 03",
  );
  let checkChain: (matrix, whichPlayer, int) => bool =
    (inMatrix, inPlayer, chainNum) =>
      switch (inPlayer) {
      | P1 => isChainInAMatrix(inMatrix, Red, chainNum)
      | P2 => isChainInAMatrix(inMatrix, Yellow, chainNum)
      };
  /* #region Testing Case: checkWin */
  checkExpect(
    checkChain(
      [
        [None, None, None, None, None],
        [None, None, None, None, Red],
        [None, None, None, None, Red],
        [None, None, None, None, Red],
      ],
      P1,
      4,
    ),
    false,
    "check for checkChain 01",
  );
  checkExpect(
    checkChain(
      [
        [None, None, None, None, Red],
        [None, None, None, None, Red],
        [None, None, None, None, Red],
        [None, None, None, None, Red],
      ],
      P1,
      4,
    ),
    true,
    "check for checkChain 02",
  );
  checkExpect(
    checkChain(
      [
        [Red, None, None, None],
        [Yellow, None, None, None],
        [Red, None, None, None],
        [Red, None, None, None],
      ],
      P1,
      4,
    ),
    false,
    "check for checkChain 02-2",
  );
  checkExpect(
    checkChain(
      [
        [None, None, None, None, None],
        [None, None, None, None, None],
        [None, None, None, None, Red],
        [None, None, None, Yellow, Red],
      ],
      P1,
      4,
    ),
    false,
    "check for checkChain 03",
  );
  checkExpect(
    checkChain(
      [
        [None, None, None, None, None],
        [None, None, None, None, None],
        [None, None, None, Yellow, Red],
        [None, None, Red, Red, Red],
      ],
      P1,
      4,
    ),
    false,
    "check for checkChain 04",
  );
  let countChain: (matrix, whichPlayer, int) => int =
    (inMatrix, inPlayer, chainNum) =>
      switch (inPlayer) {
      | P1 => countOpenChainInAMatrix(inMatrix, Red, chainNum)
      | P2 => countOpenChainInAMatrix(inMatrix, Yellow, chainNum)
      };
  checkExpect(
    countChain(
      [
        [None, None, None, None, None],
        [None, None, None, None, Red],
        [None, None, None, Yellow, Red],
        [None, None, Red, Red, Red],
      ],
      P1,
      3,
    ),
    2,
    "check for countChain 01",
  );
  checkExpect(
    countChain(
      [
        [None, None, None, None, None],
        [None, None, Red, None, Red],
        [None, None, None, Red, Red],
        [None, None, Red, Red, Red],
      ],
      P1,
      3,
    ),
    4,
    "check for countChain 02",
  );
  /* #endregion */
  /* nextState:
   * Input: (state, move).
   * Output: state.
   */
  let nextState: (state, move) => state = {
    (inState, inMove) =>
      switch (inState, inMove) {
      | (State(Win(_), _), _) => inState
      | (State(Draw, _), _) => inState
      | (State(Ongoing(inPlayer), inMatrix), Move(noOfCol)) =>
        let newMatrix: matrix = nextStateHelper(inMatrix, noOfCol, inPlayer);
        //Js.log(stringOfPlayer(inPlayer));
        //Js.log(checkWin(newMatrix, inPlayer));
        //Js.log(stringOfMatrix(newMatrix));
        //Js.log(newMatrix);
        if (checkChain(newMatrix, inPlayer, 4)) {
          // got a winner. test on the next step before update the print
          State(
            Win(inPlayer),
            newMatrix,
          );
        } else if (!List.mem(None, List.flatten(inMatrix))) {
          // no winner and the board is Full => Draw
          State(Draw, newMatrix);
        } else {
          // no winner and no full => keep going
          State(
            Ongoing(otherPlayer(inPlayer)),
            newMatrix,
          );
        };
      };
  };
  /* Testing Case: nextState */
  let inMatrix0: matrix = [
    [None, None, None, None],
    [None, None, None, None],
    [None, None, None, None],
  ];
  let inMatrix1: matrix = [
    [None, None, None, None],
    [None, None, None, Red],
    [None, None, None, None],
  ];
  checkExpect(
    nextState(State(Ongoing(P1), inMatrix0), Move(1)),
    State(Ongoing(P2), inMatrix1),
    "checking for nextState 01",
  );
  let inMatrix2: matrix = [
    [None, None, None, None],
    [None, None, None, None],
    [None, None, None, Yellow],
  ];
  let inMatrix3: matrix = [
    [None, None, None, None],
    [None, None, None, Red],
    [None, None, None, Yellow],
  ];
  checkExpect(
    nextState(State(Ongoing(P1), inMatrix2), Move(1)),
    State(Ongoing(P2), inMatrix3),
    "checking for nextState 02",
  );
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
    inState =>
      switch (inState) {
      | State(Ongoing(inPlayer), inMatrix) =>
        if (checkChain(inMatrix, inPlayer, 4)) {
          // one of the player win
          switch (inPlayer) {
          | P1 => 1000.0
          | P2 => (-1000.0)
          };
        } else {
          // regular ongoing states
          switch (inPlayer) {
          | P1 =>
            float_of_int(countOpenChainInAMatrix(inMatrix, Red, 3))
            +. 0.5
            *. float_of_int(countOpenChainInAMatrix(inMatrix, Red, 2))
            +. 0.25
            *. float_of_int(countOpenChainInAMatrix(inMatrix, Red, 1))
            -. float_of_int(countOpenChainInAMatrix(inMatrix, Yellow, 3))
            -. 0.5
            *. float_of_int(countOpenChainInAMatrix(inMatrix, Yellow, 2))
            -. 0.25
            *. float_of_int(countOpenChainInAMatrix(inMatrix, Yellow, 1))
          | P2 =>
            (-1.0)
            *. (
              float_of_int(countOpenChainInAMatrix(inMatrix, Yellow, 3))
              +. 0.5
              *. float_of_int(countOpenChainInAMatrix(inMatrix, Yellow, 2))
              +. 0.25
              *. float_of_int(countOpenChainInAMatrix(inMatrix, Yellow, 1))
              -. float_of_int(countOpenChainInAMatrix(inMatrix, Red, 3))
              -. 0.5
              *. float_of_int(countOpenChainInAMatrix(inMatrix, Red, 2))
              -. 0.25
              *. float_of_int(countOpenChainInAMatrix(inMatrix, Red, 1))
            )
          // 0.5 0.25 are different weights
          };
        }
      | _ => 0.0
      };
  ();
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
