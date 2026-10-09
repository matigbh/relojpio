import { describe, expect, it } from 'vitest';
import { formatClock } from '../format';
import { nextPlayerId } from '../players';
import { newGame } from './helpers';

describe('formatClock', () => {
  it.each([
    [0, '00:00'],
    [1, '00:01'],
    [59_001, '01:00'],
    [23 * 60_000 + 45_000, '23:45'],
    [3_600_000 + 5_000, '1:00:05'],
  ])('%i ms -> %s', (ms, text) => expect(formatClock(ms)).toBe(text));
});

describe('nextPlayerId', () => {
  it('starts with the first seat when nobody is active', () => {
    expect(nextPlayerId(newGame().players, null)).toBe('p1');
  });

  it('keeps the current player when everyone else is eliminated', () => {
    const players = newGame({}, 2).players.map((p) => (p.id === 'p2' ? { ...p, eliminated: true } : p));
    expect(nextPlayerId(players, 'p1')).toBe('p1');
  });
});
