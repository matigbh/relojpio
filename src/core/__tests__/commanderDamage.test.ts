import { describe, expect, it } from 'vitest';
import { getCommanderDamage, lethalCommanderSources } from '../commanderDamage';
import { describeEvent } from '../format';
import { T0, newGame, player, run } from './helpers';

const hit = (sourceId: string, delta: number, now: number, targetId = 'p2') => ({
  type: 'adjustCommanderDamage' as const,
  targetId,
  sourceId,
  delta,
  now,
});

describe('commander damage', () => {
  it('registers damage from a commander without changing life', () => {
    const g = run(newGame(), hit('p1', 5, T0));
    expect(getCommanderDamage(player(g, 'p2'), 'p1')).toBe(5);
    expect(player(g, 'p2').life).toBe(40);
  });

  it('accumulates damage from the same commander', () => {
    const g = run(newGame(), hit('p1', 5, T0), hit('p1', 7, T0 + 60_000));
    expect(getCommanderDamage(player(g, 'p2'), 'p1')).toBe(12);
  });

  it('tracks each commander independently', () => {
    const g = run(newGame(), hit('p1', 5, T0), hit('p3', 4, T0 + 1000), hit('p1', 2, T0 + 2000, 'p4'));
    const p2 = player(g, 'p2');
    expect(getCommanderDamage(p2, 'p1')).toBe(5);
    expect(getCommanderDamage(p2, 'p3')).toBe(4);
    expect(getCommanderDamage(p2, 'p4')).toBe(0);
    expect(getCommanderDamage(player(g, 'p4'), 'p1')).toBe(2);
  });

  it('flags exactly 21 as lethal', () => {
    const g = run(newGame(), hit('p1', 20, T0));
    expect(lethalCommanderSources(player(g, 'p2'))).toEqual([]);
    const lethal = run(g, hit('p1', 1, T0 + 60_000));
    expect(lethalCommanderSources(player(lethal, 'p2'))).toEqual(['p1']);
  });

  it('flags more than 21 and does not eliminate or change life', () => {
    const p2 = player(run(newGame(), hit('p1', 25, T0)), 'p2');
    expect(lethalCommanderSources(p2)).toEqual(['p1']);
    expect(p2.eliminated).toBe(false);
    expect(p2.life).toBe(40);
  });

  it('21 split across different commanders is not lethal', () => {
    const g = run(newGame(), hit('p1', 11, T0), hit('p3', 10, T0 + 1000));
    expect(lethalCommanderSources(player(g, 'p2'))).toEqual([]);
  });

  it('never goes below zero', () => {
    const g = run(newGame(), hit('p1', 3, T0), hit('p1', -5, T0 + 60_000));
    expect(getCommanderDamage(player(g, 'p2'), 'p1')).toBe(0);
  });

  it('ignores damage from a player to themselves', () => {
    const g = newGame();
    expect(run(g, hit('p2', 5, T0))).toBe(g);
  });

  it('sets a total directly', () => {
    const g = run(newGame(), { type: 'setCommanderDamage', targetId: 'p2', sourceId: 'p1', value: 14, now: T0 });
    expect(getCommanderDamage(player(g, 'p2'), 'p1')).toBe(14);
  });

  it('undo removes the last damage registered', () => {
    let g = run(newGame(), hit('p1', 5, T0), hit('p1', 7, T0 + 60_000));
    g = run(g, { type: 'undo', now: T0 + 61_000 });
    expect(getCommanderDamage(player(g, 'p2'), 'p1')).toBe(5);
    g = run(g, { type: 'undo', now: T0 + 62_000 });
    expect(getCommanderDamage(player(g, 'p2'), 'p1')).toBe(0);
  });

  it('undo after crossing 21 clears the lethal state', () => {
    let g = run(newGame(), hit('p1', 18, T0), hit('p1', 3, T0 + 60_000));
    expect(lethalCommanderSources(player(g, 'p2'))).toEqual(['p1']);
    g = run(g, { type: 'undo', now: T0 + 61_000 });
    expect(lethalCommanderSources(player(g, 'p2'))).toEqual([]);
  });

  it('describes events using the commander name', () => {
    const g = run(newGame(), hit('p1', 5, T0));
    expect(describeEvent(g.history[0].event, g.players)).toBe('Juan recibe 5 de daño de comandante de Malcolm (5)');
  });
});
