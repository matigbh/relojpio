import { useEffect, useRef } from 'react';
import { lowTimeThresholdMs } from '../../core/constants';
import { findPlayer } from '../../core/players';
import { getLiveClock } from '../../core/timer';
import type { GameState, PlayerId } from '../../core/types';
import { cueForTransition } from '../../feedback/cues';
import { playCue, type Cue } from '../../feedback/feedback';
import type { Settings } from '../../settings/settings';

function isLow(state: GameState, playerId: PlayerId, now: number): boolean {
  const threshold = lowTimeThresholdMs(state.config.initialTimeMs);
  const player = findPlayer(state.players, playerId);
  if (threshold == null || !player) return false;
  const { remainingMs } = getLiveClock(player, state.clock, now);
  return remainingMs != null && remainingMs > 0 && remainingMs <= threshold;
}

/** Plays sounds/vibration in response to game changes. */
export function useGameFeedback(state: GameState, now: number, settings: Settings) {
  const previous = useRef(state);
  // Players already warned about low time; seeded so a restored game doesn't re-warn.
  const warnedLow = useRef<Set<PlayerId>>(new Set(state.players.filter((p) => isLow(state, p.id, now)).map((p) => p.id)));
  const play = useRef((cue: Cue) => playCue(cue, settings));
  play.current = (cue: Cue) => playCue(cue, settings);

  useEffect(() => {
    const before = previous.current;
    previous.current = state;
    if (before === state) return;
    const cue = cueForTransition(before, state);
    if (cue) play.current(cue);
  }, [state]);

  useEffect(() => {
    const activeId = state.clock.activePlayerId;
    if (activeId == null) return;
    if (isLow(state, activeId, now)) {
      if (!warnedLow.current.has(activeId)) {
        warnedLow.current.add(activeId);
        play.current('lowTime');
      }
    } else if (!findPlayer(state.players, activeId)?.clock.timedOut) {
      warnedLow.current.delete(activeId); // An increment or undo gave time back.
    }
  }, [state, now]);
}
