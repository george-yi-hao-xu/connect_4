import { connect4 } from "./connect4";
import { create_AI_player } from "./aiPlayer";
import { create_human_player } from "./humanPlayer";
import { playGame } from "./referee";

async function main() {
  const mode = process.argv[2] || "human-ai";

  switch (mode) {
    case "ai": {
      const p1 = create_AI_player(connect4, "MAX");
      const p2 = create_AI_player(connect4, "MIN");
      await playGame(connect4, p1, p2);
      break;
    }
    case "human": {
      const p1 = create_human_player(connect4, "MAX");
      const p2 = create_human_player(connect4, "MIN");
      await playGame(connect4, p1, p2);
      break;
    }
    case "human-ai":
    default: {
      const p1 = create_human_player(connect4, "MAX");
      const p2 = create_AI_player(connect4, "MIN");
      await playGame(connect4, p1, p2);
      break;
    }
  }
}

main();
