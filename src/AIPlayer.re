open! CS17SetupGame;
open Game;

module AIPlayer = (MyGame: Game) => {
  module PlayerGame = MyGame; // Connect4
  /* TODO */
  let nextMove: PlayerGame.state => PlayerGame.move =
    s => {
      // simple version;
      // List.hd(PlayerGame.legalMoves(s));
      switch(s){
        | State(Ongoing(inPlayer), inMatrix) =>
        // TO DO: the emeny's all legal move (7 or less); store in a tree
        // PlayerGame.legalMoves 
        // TO DO: AI(this)'s all legal move and its estimate value
        // TO DO: pick the min/max(minimax) and return the BEST move
      }
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
