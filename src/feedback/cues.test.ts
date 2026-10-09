import { describe, expect, it } from 'vitest';
import { MIN, T0, newGame, run } from '../core/__tests__/helpers';
import { cueForTransition } from './cues';

describe('cueForTransition', () => {
  it('signals a turn change', () => {
    const before = newGame();
    expect(cueForTransition(before, run(before, { type: 'activatePlayer', playerId: 'p1', now: T0 }))).toBe('turn');
  });

  it('signals reaching 21 commander damage, over a turn change', () => {
    const before = run(newGame(), { type: 'adjustCommanderDamage', targetId: 'p2', sourceId: 'p1', delta: 20, now: T0 });
    const after = run(before, { type: 'adjustCommanderDamage', targetId: 'p2', sourceId: 'p1', delta: 1, now: T0 + MIN });
    expect(cueForTransition(before, after)).toBe('lethal');
  });

  it('signals a timeout', () => {
    const before = run(newGame({ initialTimeMs: MIN }), { type: 'activatePlayer', playerId: 'p1', now: T0 });
    expect(cueForTransition(before, run(before, { type: 'expireClock', now: T0 + 2 * MIN }))).toBe('timeout');
  });

  it('stays silent for life changes', () => {
    const before = newGame();
    expect(cueForTransition(before, run(before, { type: 'adjustLife', playerId: 'p1', delta: -3, now: T0 }))).toBeNull();
  });
});
