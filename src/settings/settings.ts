import { STORAGE_KEYS, readJson, writeJson } from '../persistence/storage';

export type ThemeName = 'dark' | 'light' | 'contrast';

export interface Settings {
  theme: ThemeName;
  sound: boolean;
  vibration: boolean;
  /** Shows the action log. Undo always works regardless. */
  historyEnabled: boolean;
  /** Prevents the screen from sleeping during a game (Screen Wake Lock API). */
  keepAwake: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  theme: 'dark',
  sound: true,
  vibration: true,
  historyEnabled: true,
  keepAwake: true,
};

const isObject = (value: unknown): value is Partial<Settings> => typeof value === 'object' && value != null;

export const settingsStorage = {
  load: (): Settings => ({ ...DEFAULT_SETTINGS, ...(readJson(STORAGE_KEYS.settings, isObject) ?? {}) }),
  save: (settings: Settings): void => writeJson(STORAGE_KEYS.settings, settings),
};
