import { describe, expect, it } from 'vitest';
import { getLiveClock, hasActiveClockExpired, isClockRunning } from '../timer';
import type { GameState } from '../types';
import { MIN, T0, newGame, player, run } from './helpers';

const live = (state: GameState, id: string, now: number) => getLiveClock(player(state, id), state.clock, now);
const restoreFromStorage = (state: GameState): GameState => JSON.parse(JSON.stringify(state));

describe('timer', () => {
  it('starts with no clock running and full banks', () => {
    const g = newGame();
    expect(g.clock.activePlayerId).toBeNull();
    expect(isClockRunning(g.clock)).toBe(false);
    expect(live(g, 'p1', T0 + MIN).remainingMs).toBe(20 * MIN);
  });

  it('runs only the active player clock', () => {
    const g = run(newGame(), { type: 'activatePlayer', playerId: 'p1', now: T0 });
    expect(isClockRunning(g.clock)).toBe(true);
    expect(live(g, 'p1', T0 + 90_000).remainingMs).toBe(20 * MIN - 90_000);
    expect(live(g, 'p2', T0 + 90_000).remainingMs).toBe(20 * MIN);
  });

  it('pause stops every clock and resume continues from the same value', () => {
    let g = run(newGame(), { type: 'activatePlayer', playerId: 'p1', now: T0 }, { type: 'pause', now: T0 + MIN });
    expect(g.clock.paused).toBe(true);
    expect(isClockRunning(g.clock)).toBe(false);
    expect(live(g, 'p1', T0 + 10 * MIN).remainingMs).toBe(19 * MIN);
    g = run(g, { type: 'resume', now: T0 + 10 * MIN });
    expect(live(g, 'p1', T0 + 11 * MIN).remainingMs).toBe(18 * MIN);
  });

  it('passing the turn stops the previous clock and starts the next one clockwise', () => {
    const g = run(newGame(), { type: 'activatePlayer', playerId: 'p1', now: T0 }, { type: 'passTurn', now: T0 + 2 * MIN });
    expect(g.clock.activePlayerId).toBe('p2');
    expect(live(g, 'p1', T0 + 5 * MIN).remainingMs).toBe(18 * MIN);
    expect(live(g, 'p2', T0 + 5 * MIN).remainingMs).toBe(17 * MIN);
  });

  it('passing while paused changes the active player but keeps clocks stopped', () => {
    const g = run(
      newGame(),
      { type: 'activatePlayer', playerId: 'p1', now: T0 },
      { type: 'pause', now: T0 + MIN },
      { type: 'passTurn', now: T0 + 2 * MIN },
    );
    expect(g.clock.activePlayerId).toBe('p2');
    expect(isClockRunning(g.clock)).toBe(false);
  });

  it('wraps around and skips eliminated players', () => {
    const g = run(
      newGame(),
      { type: 'setEliminated', playerId: 'p1', eliminated: true, now: T0 },
      { type: 'activatePlayer', playerId: 'p4', now: T0 },
      { type: 'passTurn', now: T0 + 1000 },
    );
    expect(g.clock.activePlayerId).toBe('p2');
  });

  it('can give the turn directly to any player', () => {
    const g = run(
      newGame(),
      { type: 'activatePlayer', playerId: 'p1', now: T0 },
      { type: 'activatePlayer', playerId: 'p3', now: T0 + 1000 },
    );
    expect(g.clock.activePlayerId).toBe('p3');
  });

  it('applies the increment to the player who passes', () => {
    const g = run(
      newGame({ incrementMs: 10_000 }),
      { type: 'activatePlayer', playerId: 'p1', now: T0 },
      { type: 'passTurn', now: T0 + MIN },
    );
    expect(player(g, 'p1').clock.remainingMs).toBe(19 * MIN + 10_000);
  });

  it('times out at zero: stops, marks the player and does not eliminate them', () => {
    let g = run(newGame({ initialTimeMs: MIN }), { type: 'activatePlayer', playerId: 'p1', now: T0 });
    expect(hasActiveClockExpired(g, T0 + MIN - 1)).toBe(false);
    expect(hasActiveClockExpired(g, T0 + MIN + 500)).toBe(true);
    g = run(g, { type: 'expireClock', now: T0 + MIN + 500 });
    const p1 = player(g, 'p1');
    expect(p1.clock).toEqual({ remainingMs: 0, usedMs: MIN, timedOut: true });
    expect(p1.eliminated).toBe(false);
    expect(isClockRunning(g.clock)).toBe(false);
    expect(g.clock.activePlayerId).toBe('p1');
    // The game continues: passing still works and no increment revives the bank.
    g = run(g, { type: 'passTurn', now: T0 + 2 * MIN });
    expect(g.clock.activePlayerId).toBe('p2');
    expect(player(g, 'p1').clock.remainingMs).toBe(0);
  });

  it('a timed-out player can be given the turn but their clock does not run', () => {
    let g = run(
      newGame({ initialTimeMs: MIN }),
      { type: 'activatePlayer', playerId: 'p1', now: T0 },
      { type: 'expireClock', now: T0 + 2 * MIN },
    );
    g = run(g, { type: 'passTurn', now: T0 + 3 * MIN }, { type: 'activatePlayer', playerId: 'p1', now: T0 + 4 * MIN });
    expect(g.clock.activePlayerId).toBe('p1');
    expect(isClockRunning(g.clock)).toBe(false);
  });

  it('expireClock is a no-op while time remains', () => {
    const g = run(newGame(), { type: 'activatePlayer', playerId: 'p1', now: T0 });
    expect(run(g, { type: 'expireClock', now: T0 + 1000 })).toBe(g);
  });

  it('restores correctly after background: elapsed time is derived from timestamps', () => {
    const g = run(newGame(), { type: 'activatePlayer', playerId: 'p2', now: T0 });
    const restored = restoreFromStorage(g);
    expect(restored.clock.activePlayerId).toBe('p2');
    expect(live(restored, 'p2', T0 + 7 * MIN).remainingMs).toBe(13 * MIN);
  });

  it('detects expiry that happened while in background and caps at zero', () => {
    const g = run(newGame({ initialTimeMs: 5 * MIN }), { type: 'activatePlayer', playerId: 'p1', now: T0 });
    const restored = restoreFromStorage(g);
    const later = T0 + 30 * MIN;
    expect(hasActiveClockExpired(restored, later)).toBe(true);
    const expired = run(restored, { type: 'expireClock', now: later });
    expect(player(expired, 'p1').clock).toEqual({ remainingMs: 0, usedMs: 5 * MIN, timedOut: true });
  });

  it('paused games stay paused after restore', () => {
    const g = run(newGame(), { type: 'activatePlayer', playerId: 'p1', now: T0 }, { type: 'pause', now: T0 + MIN });
    const restored = restoreFromStorage(g);
    expect(live(restored, 'p1', T0 + 60 * MIN).remainingMs).toBe(19 * MIN);
  });

  it('unlimited time counts usage and never expires', () => {
    const g = run(newGame({ initialTimeMs: null }), { type: 'activatePlayer', playerId: 'p1', now: T0 });
    const clock = live(g, 'p1', T0 + 99 * MIN);
    expect(clock.remainingMs).toBeNull();
    expect(clock.usedMs).toBe(99 * MIN);
    expect(hasActiveClockExpired(g, T0 + 999 * MIN)).toBe(false);
  });

  it('undoing a turn pass returns the turn and charges the elapsed time to the previous player', () => {
    let g = run(
      newGame({ incrementMs: 5000 }),
      { type: 'activatePlayer', playerId: 'p1', now: T0 },
      { type: 'passTurn', now: T0 + MIN },
    );
    g = run(g, { type: 'undo', now: T0 + MIN + 20_000 });
    expect(g.clock.activePlayerId).toBe('p1');
    expect(isClockRunning(g.clock)).toBe(true);
    expect(live(g, 'p1', T0 + MIN + 20_000).remainingMs).toBe(20 * MIN - MIN - 20_000);
    expect(live(g, 'p2', T0 + MIN + 20_000).remainingMs).toBe(20 * MIN);
  });

  it('undoing the first turn returns to the not-started state', () => {
    const g = run(newGame(), { type: 'activatePlayer', playerId: 'p1', now: T0 }, { type: 'undo', now: T0 + 5000 });
    expect(g.clock.activePlayerId).toBeNull();
    expect(player(g, 'p1').clock.remainingMs).toBe(20 * MIN);
  });
});
