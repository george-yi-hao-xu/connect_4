import { useCallback, useEffect, useRef, useState } from 'react';
import { connect4 } from './games/connect4';
import { create_AI_player } from './algo/aiPlayer';
import { create_web_human_player } from './algo/webPlayer';
import { playGame } from './algo/referee';
import type { Move, Player, State } from './algo/types';

import { Board } from './components/Board';
import { Controls } from './components/Controls';
import { Status } from './components/Status';
import { Terminal } from './components/Terminal';

const INITIAL_DIMS = '5 6';

export default function App() {
  const [state, setState] = useState<State | null>(() => connect4.init(INITIAL_DIMS));
  const [mode, setMode] = useState('human-ai');
  const [logs, setLogs] = useState<string[]>([]);
  // freeze when ai is doing the work
  const [free, setFree] = useState(false);

  const moveResolverRef = useRef<((move: Move) => void) | null>(null);
  const moveRejecterRef = useRef<((reason: Error) => void) | null>(null);
  const pendingStateRef = useRef<State | null>(null);
  const startedRef = useRef(false);
  const prevModeRef = useRef(mode);

  const log = useCallback((line: string) => {
    setLogs((prev) => [...prev, line]);
  }, []);

  const requestHumanMove = useCallback(async (s: State): Promise<Move> => {
    setState(s);
    pendingStateRef.current = s;
    setFree(true);
    return new Promise((resolve, reject) => {
      moveResolverRef.current = resolve;
      moveRejecterRef.current = reject;
    });
  }, []);

  const handleColumnClick = useCallback((col: number) => {
    if (!moveResolverRef.current || !pendingStateRef.current) return;

    const legal = connect4.get_legal_moves(pendingStateRef.current).some((m) => m.col === col);
    if (!legal) return;

    moveResolverRef.current({ tag: 'Move', col });
    moveResolverRef.current = null;
    moveRejecterRef.current = null;
    pendingStateRef.current = null;
    setFree(false);
  }, []);

  const wrapWithRenderer = useCallback((player: Player): Player => {
    return {
      ...player,
      get_next_move: async (s: State) => {
        setState(s);
        return await player.get_next_move(s);
      },
    };
  }, []);

  const startGame = useCallback(async () => {
    if (moveRejecterRef.current) {
      moveRejecterRef.current(new Error('Game restarted'));
    }
    moveResolverRef.current = null;
    moveRejecterRef.current = null;
    pendingStateRef.current = null;
    setFree(false);

    setLogs([]);
    log('Game started...');

    let p1: Player;
    let p2: Player;

    switch (mode) {
      case 'ai': {
        p1 = wrapWithRenderer(create_AI_player(connect4, 'MAX', 100));
        p2 = wrapWithRenderer(create_AI_player(connect4, 'MIN', 50));
        break;
      }
      case 'human': {
        p1 = wrapWithRenderer(create_web_human_player(connect4, 'MAX', requestHumanMove));
        p2 = wrapWithRenderer(create_web_human_player(connect4, 'MIN', requestHumanMove));
        break;
      }
      case 'human-ai':
      default: {
        p1 = wrapWithRenderer(create_web_human_player(connect4, 'MAX', requestHumanMove));
        p2 = wrapWithRenderer(create_AI_player(connect4, 'MIN', 400));
        break;
      }
    }

    // GAME LOOP ENG
    try {
      const finalState = await playGame(connect4, p1, p2, INITIAL_DIMS);

      setState(finalState);

      const status = connect4.get_game_status(finalState);
      if (status.tag === 'Win') {
        log(`${connect4.str_player(status.player)} wins!`);
      } else if (status.tag === 'Draw') {
        log('Draw...');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (message !== 'Game restarted') {
        log(`Error: ${message}`);
      }
    }
  }, [mode, log, requestHumanMove, wrapWithRenderer]);

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

  return (
    <main>
      <h1>Connect 4</h1>
      <Controls
        mode={mode}
        onModeChange={setMode}
        onStart={startGame}
      />
      {/* <Status state={state} /> */}
      <Board state={state} onColumnClick={handleColumnClick} disabled={!free} />
      <Terminal state={state} logs={logs} />
    </main>
  );
}
