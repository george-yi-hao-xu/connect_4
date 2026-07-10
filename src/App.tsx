import { useCallback, useRef, useState } from 'react';
import { connect4 } from './connect4';
import { create_AI_player } from './aiPlayer';
import { create_web_human_player } from './webPlayer';
import { playGame } from './referee';
import type { Move, Player, State } from './types';

import { Board } from './components/Board';
import { Controls } from './components/Controls';
import { Status } from './components/Status';
import { Terminal } from './components/Terminal';

export default function App() {
  const [state, setState] = useState<State | null>(null);
  const [mode, setMode] = useState('human-ai');
  const [logs, setLogs] = useState<string[]>([]);
  const [running, setRunning] = useState(false);

  const moveResolverRef = useRef<((move: Move) => void) | null>(null);
  const pendingStateRef = useRef<State | null>(null);

  const log = useCallback((line: string) => {
    setLogs((prev) => [...prev, line]);
  }, []);

  const requestHumanMove = useCallback(async (s: State): Promise<Move> => {
    setState(s);
    pendingStateRef.current = s;
    return new Promise((resolve) => {
      moveResolverRef.current = resolve;
    });
  }, []);

  const handleColumnClick = useCallback((col: number) => {
    if (!moveResolverRef.current || !pendingStateRef.current) return;

    const legal = connect4.get_legal_moves(pendingStateRef.current).some((m) => m.col === col);
    if (!legal) return;

    moveResolverRef.current({ tag: 'Move', col });
    moveResolverRef.current = null;
    pendingStateRef.current = null;
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
    setRunning(true);
    setLogs([]);
    log('Game started...');

    let p1: Player;
    let p2: Player;

    switch (mode) {
      case 'ai': {
        p1 = wrapWithRenderer(create_AI_player(connect4, 'MAX'));
        p2 = wrapWithRenderer(create_AI_player(connect4, 'MIN'));
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
        p2 = wrapWithRenderer(create_AI_player(connect4, 'MIN'));
        break;
      }
    }

    try {
      const finalState = await playGame(connect4, p1, p2, '5 6');
      setState(finalState);

      const status = connect4.get_game_status(finalState);
      if (status.tag === 'Win') {
        log(`${connect4.str_player(status.player)} wins!`);
      } else if (status.tag === 'Draw') {
        log('Draw...');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      log(`Error: ${message}`);
    } finally {
      setRunning(false);
    }
  }, [mode, log, requestHumanMove, wrapWithRenderer]);

  return (
    <main>
      <h1>Connect 4</h1>
      <Controls
        mode={mode}
        onModeChange={setMode}
        onStart={startGame}
        running={running}
      />
      <Status state={state} />
      <Board state={state} onColumnClick={handleColumnClick} />
      <Terminal logs={logs} />
    </main>
  );
}
