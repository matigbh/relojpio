import { describe, expect, it } from 'vitest';
import { T0, newGame, player, run } from './helpers';

const adjust = (delta: number, now = T0, playerId = 'p1') => ({ type: 'adjustLife' as const, playerId, delta, now });

describe('life', () => {
  it('starts at the configured life', () => {
    expect(player(newGame(), 'p1').life).toBe(40);
    expect(player(newGame({ startingLife: 30 }), 'p3').life).toBe(30);
  });

  it.each([
    [1, 41],
    [-1, 39],
    [5, 45],
    [-5, 35],
  ])('adjusts by %i', (delta, expected) => {
    expect(player(run(newGame(), adjust(delta)), 'p1').life).toBe(expected);
  });

  it('only changes the targeted player', () => {
    expect(player(run(newGame(), adjust(-7)), 'p2').life).toBe(40);
  });

  it('allows negative life and does not eliminate automatically', () => {
    const g = run(newGame(), { type: 'setLife', playerId: 'p1', value: 2, now: T0 }, adjust(-5, T0 + 10_000));
    expect(player(g, 'p1').life).toBe(-3);
    expect(player(g, 'p1').eliminated).toBe(false);
  });

  it('sets life directly', () => {
    expect(player(run(newGame(), { type: 'setLife', playerId: 'p1', value: 17, now: T0 }), 'p1').life).toBe(17);
  });

  it('undo reverts the last change', () => {
    const g = run(newGame(), adjust(-3), adjust(5, T0 + 10_000), { type: 'undo', now: T0 + 11_000 });
    expect(player(g, 'p1').life).toBe(37);
  });

  it('rapid taps merge into one history entry and undo together', () => {
    let g = run(newGame(), adjust(-1, T0), adjust(-1, T0 + 500), adjust(-1, T0 + 1000));
    expect(g.history).toHaveLength(1);
    expect(g.history[0].event).toMatchObject({ type: 'life', delta: -3, result: 37 });
    g = run(g, { type: 'undo', now: T0 + 2000 });
    expect(player(g, 'p1').life).toBe(40);
    expect(g.history).toHaveLength(0);
  });

  it('taps that cancel out leave no history entry', () => {
    const g = run(newGame(), adjust(1, T0), adjust(-1, T0 + 500));
    expect(g.history).toHaveLength(0);
  });

  it('changes separated by more than the merge window are separate entries', () => {
    expect(run(newGame(), adjust(-1, T0), adjust(-1, T0 + 10_000)).history).toHaveLength(2);
  });

  it('undo does not touch the running clock', () => {
    let g = run(newGame(), { type: 'activatePlayer', playerId: 'p1', now: T0 }, adjust(-2, T0 + 10_000));
    g = run(g, { type: 'undo', now: T0 + 20_000 });
    expect(g.clock.activePlayerId).toBe('p1');
    expect(g.clock.runningSince).toBe(T0);
  });

  it('undo with empty history is a no-op', () => {
    const g = newGame();
    expect(run(g, { type: 'undo', now: T0 })).toBe(g);
  });

  it('elimination is manual and undoable', () => {
    let g = run(newGame(), { type: 'setEliminated', playerId: 'p1', eliminated: true, now: T0 });
    expect(player(g, 'p1').eliminated).toBe(true);
    g = run(g, { type: 'undo', now: T0 + 1000 });
    expect(player(g, 'p1').eliminated).toBe(false);
  });

  it('restart keeps players and edited names but resets counters', () => {
    const g = run(
      newGame(),
      adjust(-10),
      { type: 'updatePlayerInfo', playerId: 'p1', commanderName: 'Edgar Markov' },
      { type: 'restart', now: T0 + 1000 },
    );
    expect(player(g, 'p1').life).toBe(40);
    expect(player(g, 'p1').commanderName).toBe('Edgar Markov');
    expect(g.history).toHaveLength(0);
  });
});
