import { useCallback, useEffect, useRef, useState } from 'react';
import { create_AI_player } from '../algo/aiPlayer';
import { subscribe_logs } from '../algo/printer';
import { create_web_human_player } from '../algo/webPlayer';
import { playGame } from '../algo/referee';
import type { Game, Player } from '../algo/types';
import type { HumanPlayerControls } from './useHumanPlayer';

export interface GameSession<S, M> {
  state: S | null;
  logs: string[];
  startGame: () => Promise<void>;
}

export function useGameSession<S, M>(
  game: Game<S, M>,
  human: HumanPlayerControls<S, M>,
  mode: string,
  initialDims: string,
  aiDepth = 3,
): GameSession<S, M> {
  const MAX_LOG_LINES = 200;

  const [state, setState] = useState<S | null>(() => game.init(initialDims));
  const [logs, setLogs] = useState<string[]>([]);

  const startedRef = useRef(false);
  const prevModeRef = useRef(mode);

  const log = useCallback((line: string) => {
    setLogs((prev) => {
      const next = [...prev, line];
      if (next.length > MAX_LOG_LINES) {
        next.splice(0, next.length - MAX_LOG_LINES);
      }
      return next;
    });
  }, []);

  useEffect(() => {
    // cancel subscription when offload
    return subscribe_logs(log);
  }, [log]);

  const wrapWithRenderer = useCallback((player: Player<S, M>): Player<S, M> => {
    return {
      ...player,
      get_next_move: async (s: S) => {
        setState(s);
        return await player.get_next_move(s);
      },
    };
  }, []);

  const startGame = useCallback(async () => {
    human.reset();

    setLogs([]);
    log('Game started...');

    let p1: Player<S, M>;
    let p2: Player<S, M>;

    switch (mode) {
      case 'ai': {
        p1 = wrapWithRenderer(create_AI_player(game, 'AI_MAX', 100, Math.random, aiDepth));
        p2 = wrapWithRenderer(create_AI_player(game, 'AI_MIN', 50, Math.random, aiDepth));
        break;
      }
      case 'human': {
        p1 = wrapWithRenderer(create_web_human_player(game, '001', human.requestMove));
        p2 = wrapWithRenderer(create_web_human_player(game, '002', human.requestMove));
        break;
      }
      case 'human-ai':
      default: {
        p1 = wrapWithRenderer(create_web_human_player(game, 'User', human.requestMove));
        p2 = wrapWithRenderer(create_AI_player(game, 'AI', 400, Math.random, aiDepth));
        break;
      }
    }

    try {
      const finalState = await playGame(game, p1, p2, initialDims);

      setState(finalState);

      const status = game.get_game_status(finalState);
      if (status.tag === 'Win') {
        log(`${game.str_player(status.player)} wins!`);
      } else if (status.tag === 'Draw') {
        log('Draw...');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (message !== 'Game restarted') {
        log(`Error: ${message}`);
      }
    }
  }, [aiDepth, game, human, log, mode, wrapWithRenderer]);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    void startGame();
  }, [startGame]);

  useEffect(() => {
    if (prevModeRef.current === mode) return;
    prevModeRef.current = mode;
    void startGame();
  }, [mode, startGame]);

  return {
    state,
    logs,
    startGame,
  };
}
