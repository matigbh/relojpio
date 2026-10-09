export type Rotation = 0 | 90 | 180 | 270;

export interface SeatLayout {
  area: string;
  /** Rotation so the seat's content faces a player sitting at that edge of the device. */
  rotation: Rotation;
}

export interface TableLayout {
  areas: string;
  columns: string;
  rows: string;
  /** `row` when the center hub sits between two rows, `column` when between two columns. */
  hubDirection: 'row' | 'column';
  /** Indexed by seat: seat 0 is at the bottom, then clockwise (the Magic turn order). */
  seats: SeatLayout[];
}

const BOTTOM: SeatLayout = { area: 'b', rotation: 0 };
const TOP: SeatLayout = { area: 't', rotation: 180 };

/**
 * Phone lying flat in portrait in the middle of the table. Left/right seats are rotated 90°/270°
 * so each player reads their own zone upright.
 */
const LAYOUTS: Record<number, TableLayout> = {
  2: {
    areas: '"t" "h" "b"',
    columns: '1fr',
    rows: '1fr auto 1fr',
    hubDirection: 'row',
    seats: [BOTTOM, TOP],
  },
  3: {
    areas: '"l h r" "b b b"',
    columns: '1fr auto 1fr',
    rows: '1.3fr 1fr',
    hubDirection: 'column',
    seats: [BOTTOM, { area: 'l', rotation: 90 }, { area: 'r', rotation: 270 }],
  },
  4: {
    areas: '"t t t" "l h r" "b b b"',
    columns: '1fr auto 1fr',
    rows: '1fr 1.7fr 1fr',
    hubDirection: 'column',
    seats: [BOTTOM, { area: 'l', rotation: 90 }, TOP, { area: 'r', rotation: 270 }],
  },
  5: {
    areas: '"t t t" "l2 h r" "l1 h r" "b b b"',
    columns: '1fr auto 1fr',
    rows: '1fr 1fr 1fr 1fr',
    hubDirection: 'column',
    seats: [BOTTOM, { area: 'l1', rotation: 90 }, { area: 'l2', rotation: 90 }, TOP, { area: 'r', rotation: 270 }],
  },
  6: {
    areas: '"t t t" "l2 h r1" "l1 h r2" "b b b"',
    columns: '1fr auto 1fr',
    rows: '1fr 1fr 1fr 1fr',
    hubDirection: 'column',
    seats: [
      BOTTOM,
      { area: 'l1', rotation: 90 },
      { area: 'l2', rotation: 90 },
      TOP,
      { area: 'r1', rotation: 270 },
      { area: 'r2', rotation: 270 },
    ],
  },
};

export function tableLayoutFor(playerCount: number): TableLayout {
  return LAYOUTS[playerCount] ?? LAYOUTS[4];
}
