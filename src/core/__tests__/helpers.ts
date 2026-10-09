import { createGame, gameReducer, type GameAction } from '../gameReducer';
import type { GameConfig, GameState } from '../types';

export const MIN = 60_000;
export const T0 = 1_700_000_000_000;

export function makeConfig(overrides: Partial<GameConfig> = {}, playerCount = 4): GameConfig {
  return {
    startingLife: 40,
    initialTimeMs: 20 * MIN,
    incrementMs: 0,
    players: Array.from({ length: playerCount }, (_, i) => ({
      name: ['Andrés', 'Juan', 'Carlos', 'Lucía', 'Eva', 'Tom'][i],
      commanderName: ['Malcolm', 'Kediss', 'Atraxa', 'Edgar', '', ''][i],
      color: '#fff',
    })),
    ...overrides,
  };
}

export function newGame(overrides: Partial<GameConfig> = {}, playerCount = 4): GameState {
  return createGame(makeConfig(overrides, playerCount), T0);
}

export function run(state: GameState, ...actions: GameAction[]): GameState {
  return actions.reduce(gameReducer, state);
}

export function player(state: GameState, id: string) {
  const found = state.players.find((p) => p.id === id);
  if (!found) throw new Error(`no player ${id}`);
  return found;
}
