import { describe, expect, it } from 'vitest';
import { nextPlayerId } from '../core/players';
import { newGame } from '../core/__tests__/helpers';
import { passArrowAngle, seatCenter, tableLayoutFor } from './layout';

const PHONE = { width: 390, height: 844 };

/** Screen direction of a local arrow angle once the panel's rotation is applied. */
function screenAngle(localAngle: number, rotation: number): number {
  return (((localAngle + rotation) % 360) + 360) % 360;
}

describe('2×2 layout', () => {
  const layout = tableLayoutFor(4);
  // Seats: 0 = bottom-left, 1 = top-left, 2 = top-right, 3 = bottom-right (clockwise).
  const UP = 270;
  const RIGHT = 0;
  const DOWN = 90;
  const LEFT = 180;

  it('places seats clockwise around the table', () => {
    const [bl, tl, tr, br] = [0, 1, 2, 3].map((seat) => seatCenter(layout, seat));
    expect(bl.x).toBeLessThan(0.5);
    expect(bl.y).toBeGreaterThan(0.5);
    expect(tl).toMatchObject({ x: bl.x });
    expect(tl.y).toBeLessThan(0.5);
    expect(tr.x).toBeGreaterThan(0.5);
    expect(br).toMatchObject({ x: tr.x, y: bl.y });
  });

  it('turn order follows the seats: bottom-left → top-left → top-right → bottom-right', () => {
    const { players } = newGame();
    expect(nextPlayerId(players, 'p1')).toBe('p2');
    expect(nextPlayerId(players, 'p4')).toBe('p1');
  });

  it.each([
    // [from seat, to seat, expected on-screen direction]
    [0, 1, UP], // bottom-left (Beto) → top-left (David): arrow points up
    [1, 2, RIGHT], // top-left → top-right
    [2, 3, DOWN], // top-right → bottom-right
    [3, 0, LEFT], // bottom-right → bottom-left
  ])('arrow from seat %i to seat %i points %i° on screen', (from, to, expected) => {
    const local = passArrowAngle(layout, from, to, PHONE)!;
    expect(screenAngle(local, layout.seats[from].rotation)).toBe(expected);
  });

  it('accounts for the panel rotation (Beto, rotated 90°, draws the arrow pointing to his left)', () => {
    expect(passArrowAngle(layout, 0, 1, PHONE)).toBe(180);
  });

  it('returns null when the turn would stay with the same player', () => {
    expect(passArrowAngle(layout, 2, 2, PHONE)).toBeNull();
  });
});

describe('other layouts', () => {
  it('2 players: bottom passes up, top passes down (both appear "forward" to the player)', () => {
    const layout = tableLayoutFor(2);
    expect(passArrowAngle(layout, 0, 1, PHONE)).toBe(-90);
    expect(passArrowAngle(layout, 1, 0, PHONE)).toBe(-90);
  });
});
