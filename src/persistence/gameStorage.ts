import type { GameState } from '../core/types';
import { STORAGE_KEYS, readJson, removeKey, writeJson } from './storage';

function isGameState(value: unknown): value is GameState {
  if (typeof value !== 'object' || value == null) return false;
  const v = value as Partial<GameState>;
  return (
    Array.isArray(v.players) &&
    v.players.length >= 2 &&
    Array.isArray(v.history) &&
    typeof v.clock === 'object' &&
    v.clock != null &&
    typeof v.config === 'object' &&
    v.config != null
  );
}

/**
 * The game is saved as plain data including the clock's `runningSince` timestamp, so a
 * restored game resumes with the correct remaining time no matter how long the app was closed.
 */
export const gameStorage = {
  load: (): GameState | null => readJson(STORAGE_KEYS.game, isGameState),
  save: (state: GameState): void => writeJson(STORAGE_KEYS.game, state),
  clear: (): void => removeKey(STORAGE_KEYS.game),
};
