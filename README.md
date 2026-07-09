# Connect4 Terminal Game

A terminal-based Connect4 game in TypeScript with a minimax AI opponent.

Originally written in ReasonML/BuckleScript for a university project, now refactored to TypeScript + Node.js.

## Tech Stack

- **TypeScript** 5.x
- **Node.js**
- **pnpm**
- **readline-sync** for CLI input

## Project Structure

```
archive/          # Original ReasonML/BuckleScript source code
src/              # TypeScript source
  types.ts        # Shared types and interfaces
  connect4.ts     # Game rules, board state, win/draw detection, evaluation
  humanPlayer.ts  # Human CLI player
  aiPlayer.ts     # Minimax AI player
  referee.ts      # Main game loop
  index.ts        # CLI entry point
dist/             # Compiled JavaScript output
```

## Installation

```bash
pnpm install
```

## Build

```bash
pnpm build
```

This compiles TypeScript from `src/` into `dist/`.

## Run

```bash
# Human (Player 1) vs AI (Player 2) — default / dev command
pnpm dev
pnpm start

# AI vs AI
pnpm start -- ai

# Human vs Human
pnpm start -- human
```

## How to Play

When prompted, type a column number (1–6 on the default 5×6 board) and press `Enter`.

Type `exit` at any prompt to quit.

## AI

The AI uses a fixed-depth lookahead (depth = 3) with a static evaluation function:

- Open three-in-a-row: `+1.0`
- Open two-in-a-row: `+0.5`
- Open one-in-a-row: `+0.25`
- Winning position: `±1000.0`

Player 1 (Red) maximizes the evaluation; Player 2 (Yellow) minimizes it.

This matches the original university implementation.

## Notes

- The old ReasonML source and generated `.bs.js` files are preserved in `archive/` for reference.
- The game logic and AI algorithm were kept unchanged during the refactor; only the language and build toolchain changed.
