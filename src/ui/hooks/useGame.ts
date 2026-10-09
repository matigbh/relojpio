import { useEffect, useMemo, useReducer, useState } from 'react';
import { gameReducer } from '../../core/gameReducer';
import { hasActiveClockExpired, isClockRunning } from '../../core/timer';
import type { GameState, PlayerId } from '../../core/types';
import { gameStorage } from '../../persistence/gameStorage';

const TICK_MS = 200;

/** Current time, re-rendering on an interval only while `ticking` is true. */
function useNow(ticking: boolean): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!ticking) return;
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), TICK_MS);
    // Catch up immediately when returning from background instead of waiting for the next tick.
    const onVisible = () => document.visibilityState === 'visible' && setNow(Date.now());
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [ticking]);
  return ticking ? now : Date.now();
}

/** Owns the game state: reducer, persistence on every change, ticking and time-out detection. */
export function useGame(initial: GameState) {
  const [state, dispatch] = useReducer(gameReducer, initial);
  const now = useNow(isClockRunning(state.clock));

  useEffect(() => gameStorage.save(state), [state]);

  useEffect(() => {
    if (hasActiveClockExpired(state, now)) dispatch({ type: 'expireClock', now });
  }, [state, now]);

  const actions = useMemo(
    () => ({
      adjustLife: (playerId: PlayerId, delta: number) => dispatch({ type: 'adjustLife', playerId, delta, now: Date.now() }),
      setLife: (playerId: PlayerId, value: number) => dispatch({ type: 'setLife', playerId, value, now: Date.now() }),
      adjustCommanderDamage: (targetId: PlayerId, sourceId: PlayerId, delta: number) =>
        dispatch({ type: 'adjustCommanderDamage', targetId, sourceId, delta, now: Date.now() }),
      setCommanderDamage: (targetId: PlayerId, sourceId: PlayerId, value: number) =>
        dispatch({ type: 'setCommanderDamage', targetId, sourceId, value, now: Date.now() }),
      passTurn: () => dispatch({ type: 'passTurn', now: Date.now() }),
      activatePlayer: (playerId: PlayerId) => dispatch({ type: 'activatePlayer', playerId, now: Date.now() }),
      pause: () => dispatch({ type: 'pause', now: Date.now() }),
      resume: () => dispatch({ type: 'resume', now: Date.now() }),
      setEliminated: (playerId: PlayerId, eliminated: boolean) =>
        dispatch({ type: 'setEliminated', playerId, eliminated, now: Date.now() }),
      updatePlayerInfo: (playerId: PlayerId, info: { name?: string; commanderName?: string }) =>
        dispatch({ type: 'updatePlayerInfo', playerId, ...info }),
      undo: () => dispatch({ type: 'undo', now: Date.now() }),
      restart: () => dispatch({ type: 'restart', now: Date.now() }),
    }),
    [],
  );

  return { state, now, actions };
}

export type GameActions = ReturnType<typeof useGame>['actions'];
