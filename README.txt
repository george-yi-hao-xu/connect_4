yxu265

Q1:
instructions for use, describing how a user would interact with your program (how would someone play
your game against a friend? against the AI?)
A1:
In human vs human condition, the player just need to type the number in the console and click enter. After that, a new matrix will be print out in the console and the player 2 can enter the number.
In human vs AI condition, the human player can do exactly same as in the human vs human condition.

Q2:
an overview of how your program functions, including how all of the pieces fit together
A2:
Referee.re is like a platform loading the Connect4.re and HumanPlayer.re/AIPlayer.re. In the gameloop of Referee.re, the player's input/AI's move will be converted to move in the Connect4.re. After that, the new state comes out and the next player input the int.
For the AIPlayer.re, the key is the minimax and the bottomValue with a given depth. To get the bottomValue as well as the movePath, recursion is used. After that, minimax will see whether to find a max or a min. In the end, the max/min value would be converted to the move, which leads to that situation.

Q3:
a description of any possible bugs or problems with your program
A3:
1-The AI is not smart enough. When the enemy is about to win, the AI fails to block that chain.

A4:
I work on this project alone.

Q5:
a description of any extra features you chose to implement
A5:
n/a