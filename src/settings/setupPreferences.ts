import { DEFAULT_STARTING_LIFE, MAX_PLAYERS } from '../core/constants';
import type { GameConfig, PlayerSetup } from '../core/types';
import { STORAGE_KEYS, readJson, writeJson } from '../persistence/storage';

/** Original palette, chosen to stay distinguishable in every theme. */
export const PLAYER_COLORS = [
  '#e4572e', // ember
  '#2e86de', // tide
  '#3fae5a', // moss
  '#9b5de5', // amethyst
  '#f2b134', // gold
  '#ef476f', // rose
  '#17c3b2', // teal
  '#8d99ae', // slate
] as const;

export const TIME_PRESETS_MIN = [10, 15, 20, 25, 30] as const;
export const INCREMENT_PRESETS_SEC = [0, 5, 10, 15, 30] as const;

/** `'unlimited'`, `'custom'` or one of the preset minute values. */
export type TimeChoice = number | 'unlimited' | 'custom';

/** The last setup used, remembered between games. Keeps all 6 seats so names survive count changes. */
export interface SetupPreferences {
  playerCount: number;
  startingLife: number;
  timeChoice: TimeChoice;
  customMinutes: number;
  incrementSeconds: number;
  seats: PlayerSetup[];
}

export const DEFAULT_SETUP: SetupPreferences = {
  playerCount: 4,
  startingLife: DEFAULT_STARTING_LIFE,
  timeChoice: 20,
  customMinutes: 45,
  incrementSeconds: 0,
  seats: Array.from({ length: MAX_PLAYERS }, (_, i) => ({
    name: `Jugador ${i + 1}`,
    commanderName: '',
    color: PLAYER_COLORS[i],
  })),
};

export function setupToConfig(setup: SetupPreferences): GameConfig {
  const minutes =
    setup.timeChoice === 'unlimited' ? null : setup.timeChoice === 'custom' ? setup.customMinutes : setup.timeChoice;
  return {
    startingLife: setup.startingLife,
    initialTimeMs: minutes == null ? null : Math.max(1, minutes) * 60_000,
    incrementMs: setup.incrementSeconds * 1000,
    players: setup.seats.slice(0, setup.playerCount),
  };
}

const isObject = (value: unknown): value is Partial<SetupPreferences> => typeof value === 'object' && value != null;

export const setupStorage = {
  load: (): SetupPreferences => {
    const stored = readJson(STORAGE_KEYS.setup, isObject) ?? {};
    const seats = DEFAULT_SETUP.seats.map((seat, i) => ({ ...seat, ...(stored.seats?.[i] ?? {}) }));
    return { ...DEFAULT_SETUP, ...stored, seats };
  },
  save: (setup: SetupPreferences): void => writeJson(STORAGE_KEYS.setup, setup),
};
