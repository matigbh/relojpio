/**
 * Thin, failure-tolerant wrapper over localStorage. Storage can be unavailable or full
 * (private mode, quota); the app must keep working in memory when that happens.
 */

export const STORAGE_KEYS = {
  game: 'mesa.game.v1',
  settings: 'mesa.settings.v1',
  setup: 'mesa.setup.v1',
} as const;

export function readJson<T>(key: string, isValid: (value: unknown) => value is T): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (raw == null) return null;
    const parsed: unknown = JSON.parse(raw);
    return isValid(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function writeJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore: persistence is best-effort.
  }
}

export function removeKey(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // Ignore.
  }
}
