export const COMMANDER_DAMAGE_LETHAL = 21;
export const DEFAULT_STARTING_LIFE = 40;
export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 6;

/** Consecutive changes to the same counter within this window merge into one history entry. */
export const HISTORY_MERGE_WINDOW_MS = 3000;
export const HISTORY_LIMIT = 200;

const MINUTE = 60_000;

/** Low-time warning: 2 minutes, or a quarter of the bank for very short games. */
export function lowTimeThresholdMs(initialTimeMs: number | null): number | null {
  if (initialTimeMs == null) return null;
  return Math.min(2 * MINUTE, initialTimeMs * 0.25);
}
