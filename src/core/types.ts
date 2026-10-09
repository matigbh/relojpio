/**
 * Core domain types. Everything in `src/core` is framework-agnostic and pure:
 * functions receive the current time (`now`, epoch ms) instead of reading the clock,
 * which keeps the logic deterministic and testable.
 */

export type PlayerId = string;

export interface PlayerSetup {
  name: string;
  commanderName: string;
  color: string;
}

export interface GameConfig {
  startingLife: number;
  /** Per-player time bank. `null` means no limit (clocks count time used instead). */
  initialTimeMs: number | null;
  /** Fischer increment added to a player's bank when they pass the turn. */
  incrementMs: number;
  players: PlayerSetup[];
}

export interface PlayerClock {
  /** Remaining time as of the last settle. `null` when the game has no time limit. */
  remainingMs: number | null;
  /** Total time this player's clock has run, as of the last settle. */
  usedMs: number;
  timedOut: boolean;
}

export interface Player {
  id: PlayerId;
  /** Seat index around the table, clockwise starting at the bottom of the screen. */
  seat: number;
  name: string;
  commanderName: string;
  color: string;
  life: number;
  /** Commander damage received, keyed by the id of the player whose commander dealt it. */
  commanderDamage: Record<PlayerId, number>;
  eliminated: boolean;
  clock: PlayerClock;
}

export interface ClockState {
  activePlayerId: PlayerId | null;
  /**
   * Timestamp from which the active player's clock is running. Elapsed time is always
   * derived as `now - runningSince`, so time spent in background is accounted for.
   * `null` when no clock is running (paused, not started, or active player timed out).
   */
  runningSince: number | null;
  paused: boolean;
}

export type GameEvent =
  | { type: 'life'; playerId: PlayerId; delta: number; result: number; setTo?: number }
  | {
      type: 'commanderDamage';
      targetId: PlayerId;
      sourceId: PlayerId;
      delta: number;
      result: number;
      setTo?: number;
    }
  | { type: 'turn'; fromId: PlayerId | null; toId: PlayerId }
  | { type: 'eliminated'; playerId: PlayerId; eliminated: boolean };

export interface GameSnapshot {
  players: Player[];
  clock: ClockState;
}

export interface HistoryEntry {
  id: number;
  at: number;
  event: GameEvent;
  /** State right before the event, used to undo it. */
  before: GameSnapshot;
}

export interface GameState {
  config: GameConfig;
  players: Player[];
  clock: ClockState;
  history: HistoryEntry[];
  nextHistoryId: number;
  startedAt: number;
}
