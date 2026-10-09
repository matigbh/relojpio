import { HISTORY_LIMIT, HISTORY_MERGE_WINDOW_MS } from './constants';
import type { GameEvent, GameSnapshot, GameState, HistoryEntry } from './types';

export function takeSnapshot(state: GameState): GameSnapshot {
  return { players: state.players, clock: state.clock };
}

/**
 * Rapid taps on the same counter (e.g. -1 -1 -1) merge into one entry so the log reads
 * "loses 3 life" and a single undo reverts the whole burst.
 */
function mergeEvents(previous: GameEvent, next: GameEvent): GameEvent | null {
  if (previous.type === 'life' && next.type === 'life') {
    if (previous.playerId !== next.playerId || previous.setTo != null || next.setTo != null) return null;
    return { ...next, delta: previous.delta + next.delta };
  }
  if (previous.type === 'commanderDamage' && next.type === 'commanderDamage') {
    if (
      previous.targetId !== next.targetId ||
      previous.sourceId !== next.sourceId ||
      previous.setTo != null ||
      next.setTo != null
    ) {
      return null;
    }
    return { ...next, delta: previous.delta + next.delta };
  }
  return null;
}

function isNoOp(event: GameEvent): boolean {
  return (event.type === 'life' || event.type === 'commanderDamage') && event.setTo == null && event.delta === 0;
}

/** Appends `event` to `state.history`, recording `before` so the event can be undone. */
export function recordEvent(state: GameState, event: GameEvent, before: GameSnapshot, now: number): GameState {
  const last = state.history[state.history.length - 1];
  if (last && now - last.at <= HISTORY_MERGE_WINDOW_MS) {
    const merged = mergeEvents(last.event, event);
    if (merged) {
      const rest = state.history.slice(0, -1);
      const history = isNoOp(merged) ? rest : [...rest, { ...last, at: now, event: merged }];
      return { ...state, history };
    }
  }

  const entry: HistoryEntry = { id: state.nextHistoryId, at: now, event, before };
  const history = [...state.history, entry].slice(-HISTORY_LIMIT);
  return { ...state, history, nextHistoryId: state.nextHistoryId + 1 };
}

export function lastHistoryEntry(state: GameState): HistoryEntry | undefined {
  return state.history[state.history.length - 1];
}
