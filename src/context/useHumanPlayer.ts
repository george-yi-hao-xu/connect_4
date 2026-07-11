import { useCallback, useRef, useState } from 'react';

export interface HumanPlayerControls<S, M> {
  isAwaitingMove: boolean;
  requestMove: (state: S) => Promise<M>;
  onMove: (move: M) => void;
  reset: (reason?: string) => void;
}

export function useHumanPlayer<S, M>(): HumanPlayerControls<S, M> {
  const [isAwaitingMove, setIsAwaitingMove] = useState(false);

  const resolverRef = useRef<((move: M) => void) | null>(null);
  const rejecterRef = useRef<((reason: Error) => void) | null>(null);
  const pendingStateRef = useRef<S | null>(null);

  const requestMove = useCallback(async (state: S): Promise<M> => {
    pendingStateRef.current = state;
    setIsAwaitingMove(true);

    return new Promise<M>((resolve, reject) => {
      resolverRef.current = resolve;
      rejecterRef.current = reject;
    });
  }, []);

  const onMove = useCallback((move: M) => {
    if (!resolverRef.current) return;

    resolverRef.current(move);
    resolverRef.current = null;
    rejecterRef.current = null;
    pendingStateRef.current = null;
    setIsAwaitingMove(false);
  }, []);

  const reset = useCallback((reason = 'Game restarted') => {
    if (rejecterRef.current) {
      rejecterRef.current(new Error(reason));
    }
    resolverRef.current = null;
    rejecterRef.current = null;
    pendingStateRef.current = null;
    setIsAwaitingMove(false);
  }, []);

  return {
    isAwaitingMove,
    requestMove,
    onMove,
    reset,
  };
}
