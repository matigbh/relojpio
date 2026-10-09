import { findPlayer, updatePlayer } from './players';
import type { ClockState, GameState, Player, PlayerClock, PlayerId } from './types';

export function isClockRunning(clock: ClockState): boolean {
  return clock.activePlayerId != null && clock.runningSince != null;
}

/** A player's clock as it is at `now`, including time elapsed since the last settle. */
export function getLiveClock(player: Player, clock: ClockState, now: number): PlayerClock {
  if (player.id !== clock.activePlayerId || clock.runningSince == null) return player.clock;
  const elapsed = Math.max(0, now - clock.runningSince);
  const { remainingMs, usedMs } = player.clock;
  if (remainingMs == null) return { ...player.clock, usedMs: usedMs + elapsed };
  const consumed = Math.min(elapsed, remainingMs);
  return { ...player.clock, remainingMs: remainingMs - consumed, usedMs: usedMs + consumed };
}

/** True when the active player's bank has run out but has not been marked yet. */
export function hasActiveClockExpired(state: GameState, now: number): boolean {
  const { activePlayerId } = state.clock;
  if (activePlayerId == null || !isClockRunning(state.clock)) return false;
  const player = findPlayer(state.players, activePlayerId);
  if (!player) return false;
  const live = getLiveClock(player, state.clock, now);
  return live.remainingMs != null && live.remainingMs <= 0;
}

/** Folds elapsed running time into the active player's stored clock. */
export function settleClock(state: GameState, now: number): GameState {
  const { activePlayerId, runningSince } = state.clock;
  if (activePlayerId == null || runningSince == null) return state;
  const players = updatePlayer(state.players, activePlayerId, (p) => ({
    ...p,
    clock: getLiveClock(p, state.clock, now),
  }));
  return { ...state, players, clock: { ...state.clock, runningSince: now } };
}

/** Whether a clock may run for this player (it cannot once the bank is empty). */
function canRun(player: Player | undefined): boolean {
  return player != null && !player.clock.timedOut;
}

function runningSinceFor(state: GameState, playerId: PlayerId, now: number): number | null {
  if (state.clock.paused) return null;
  return canRun(findPlayer(state.players, playerId)) ? now : null;
}

/** Stops the current clock and starts `playerId`'s. Applies the increment to the outgoing player. */
export function switchActivePlayer(state: GameState, playerId: PlayerId, now: number): GameState {
  const settled = settleClock(state, now);
  const outgoingId = settled.clock.activePlayerId;
  let players = settled.players;
  if (outgoingId != null && outgoingId !== playerId && state.config.incrementMs > 0) {
    players = updatePlayer(players, outgoingId, (p) =>
      p.clock.remainingMs == null || p.clock.timedOut
        ? p
        : { ...p, clock: { ...p.clock, remainingMs: p.clock.remainingMs + state.config.incrementMs } },
    );
  }
  const next = { ...settled, players };
  return {
    ...next,
    clock: { ...next.clock, activePlayerId: playerId, runningSince: runningSinceFor(next, playerId, now) },
  };
}

export function pauseClock(state: GameState, now: number): GameState {
  if (state.clock.paused) return state;
  const settled = settleClock(state, now);
  return { ...settled, clock: { ...settled.clock, paused: true, runningSince: null } };
}

export function resumeClock(state: GameState, now: number): GameState {
  if (!state.clock.paused) return state;
  const unpaused = { ...state, clock: { ...state.clock, paused: false } };
  const { activePlayerId } = unpaused.clock;
  return {
    ...unpaused,
    clock: {
      ...unpaused.clock,
      runningSince: activePlayerId == null ? null : runningSinceFor(unpaused, activePlayerId, now),
    },
  };
}

/** Marks the active player as out of time and stops the clock. Does not eliminate them. */
export function expireActiveClock(state: GameState, now: number): GameState {
  if (!hasActiveClockExpired(state, now)) return state;
  const settled = settleClock(state, now);
  const activeId = settled.clock.activePlayerId!;
  const players = updatePlayer(settled.players, activeId, (p) => ({
    ...p,
    clock: { ...p.clock, remainingMs: 0, timedOut: true },
  }));
  return { ...settled, players, clock: { ...settled.clock, runningSince: null } };
}

/**
 * Charges `ms` of running time to a player's stored clock (used when undoing a turn pass:
 * the time the wrong player spent is moved back to the player who actually kept playing).
 */
export function chargeTime(clock: PlayerClock, ms: number): PlayerClock {
  if (clock.remainingMs == null) return { ...clock, usedMs: clock.usedMs + ms };
  const consumed = Math.min(ms, clock.remainingMs);
  const remainingMs = clock.remainingMs - consumed;
  return {
    remainingMs,
    usedMs: clock.usedMs + consumed,
    timedOut: clock.timedOut || remainingMs <= 0,
  };
}
