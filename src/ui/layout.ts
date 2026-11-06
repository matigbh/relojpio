export type Rotation = 0 | 90 | 180 | 270;

export interface SeatLayout {
  area: string;
  /** Rotation so the seat's content faces a player sitting at that edge of the device. */
  rotation: Rotation;
  /** Where the seat is on screen, shown in the setup screen. */
  label: string;
}

export interface TableLayout {
  areas: string;
  columns: string;
  rows: string;
  /** `row` when the center hub sits between two rows, `column` when between two columns. */
  hubDirection: 'row' | 'column';
  /** Indexed by seat, clockwise around the table (the Magic turn order). */
  seats: SeatLayout[];
}

const BOTTOM: SeatLayout = { area: 'b', rotation: 0, label: 'abajo' };
const TOP: SeatLayout = { area: 't', rotation: 180, label: 'arriba' };

/**
 * Phone lying flat in portrait in the middle of the table. Left-column seats are rotated 90°
 * clockwise and right-column seats 90° counter-clockwise, so each player reads their zone upright.
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
    seats: [BOTTOM, { area: 'l', rotation: 90, label: 'izquierda' }, { area: 'r', rotation: 270, label: 'derecha' }],
  },
  // 2×2: players sit along the two long edges; the hub is a thin strip between the rows.
  4: {
    areas: '"tl tr" "h h" "bl br"',
    columns: '1fr 1fr',
    rows: '1fr minmax(52px, 6.6vh) 1fr',
    hubDirection: 'row',
    seats: [
      { area: 'bl', rotation: 90, label: 'abajo-izquierda' },
      { area: 'tl', rotation: 90, label: 'arriba-izquierda' },
      { area: 'tr', rotation: 270, label: 'arriba-derecha' },
      { area: 'br', rotation: 270, label: 'abajo-derecha' },
    ],
  },
  5: {
    areas: '"t t t" "l2 h r" "l1 h r" "b b b"',
    columns: '1fr auto 1fr',
    rows: '1fr 1fr 1fr 1fr',
    hubDirection: 'column',
    seats: [
      BOTTOM,
      { area: 'l1', rotation: 90, label: 'izquierda abajo' },
      { area: 'l2', rotation: 90, label: 'izquierda arriba' },
      TOP,
      { area: 'r', rotation: 270, label: 'derecha' },
    ],
  },
  6: {
    areas: '"t t t" "l2 h r1" "l1 h r2" "b b b"',
    columns: '1fr auto 1fr',
    rows: '1fr 1fr 1fr 1fr',
    hubDirection: 'column',
    seats: [
      BOTTOM,
      { area: 'l1', rotation: 90, label: 'izquierda abajo' },
      { area: 'l2', rotation: 90, label: 'izquierda arriba' },
      TOP,
      { area: 'r1', rotation: 270, label: 'derecha arriba' },
      { area: 'r2', rotation: 270, label: 'derecha abajo' },
    ],
  },
};

export function tableLayoutFor(playerCount: number): TableLayout {
  return LAYOUTS[playerCount] ?? LAYOUTS[4];
}

/** Splits a grid track list on top-level spaces (keeps `minmax(a, b)` together). */
function splitTracks(tracks: string): string[] {
  const result: string[] = [];
  let depth = 0;
  let current = '';
  for (const char of tracks.trim()) {
    if (char === '(') depth++;
    if (char === ')') depth--;
    if (char === ' ' && depth === 0) {
      if (current) result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  if (current) result.push(current);
  return result;
}

/** Relative size of each track: `fr` tracks by their factor; fixed/auto tracks (the hub) count as 0. */
function trackWeights(tracks: string): number[] {
  return splitTracks(tracks).map((track) => {
    const fr = /^([\d.]+)fr$/.exec(track);
    return fr ? Number(fr[1]) : 0;
  });
}

/** Center of a track span as a 0–1 fraction of the whole axis. */
function spanCenter(weights: number[], first: number, last: number): number {
  const total = weights.reduce((sum, w) => sum + w, 0);
  const start = weights.slice(0, first).reduce((sum, w) => sum + w, 0);
  const size = weights.slice(first, last + 1).reduce((sum, w) => sum + w, 0);
  return (start + size / 2) / total;
}

/** Center of a seat's grid area, as fractions (0–1) of the table's width and height. */
export function seatCenter(layout: TableLayout, seat: number): { x: number; y: number } {
  const area = layout.seats[seat].area;
  const rows = [...layout.areas.matchAll(/"([^"]+)"/g)].map((m) => m[1].trim().split(/\s+/));
  const cells = rows.flatMap((cols, r) => cols.flatMap((name, c) => (name === area ? [{ r, c }] : [])));
  const rowIndexes = cells.map((cell) => cell.r);
  const colIndexes = cells.map((cell) => cell.c);
  return {
    x: spanCenter(trackWeights(layout.columns), Math.min(...colIndexes), Math.max(...colIndexes)),
    y: spanCenter(trackWeights(layout.rows), Math.min(...rowIndexes), Math.max(...rowIndexes)),
  };
}

/**
 * Angle (degrees, 0 = pointing right, clockwise positive) at which an arrow drawn inside the
 * `from` seat's rotated panel must be turned so that, on screen, it points at the `to` seat.
 * The panel is rotated by its seat's rotation, so the screen angle is converted back into the
 * panel's own frame: localAngle = screenAngle − rotation.
 */
export function passArrowAngle(
  layout: TableLayout,
  fromSeat: number,
  toSeat: number,
  viewport: { width: number; height: number },
): number | null {
  if (fromSeat === toSeat) return null;
  const from = seatCenter(layout, fromSeat);
  const to = seatCenter(layout, toSeat);
  const dx = (to.x - from.x) * viewport.width;
  const dy = (to.y - from.y) * viewport.height;
  const screenAngle = (Math.atan2(dy, dx) * 180) / Math.PI;
  const local = screenAngle - layout.seats[fromSeat].rotation;
  // Normalize to (-180, 180] and round away floating-point noise.
  const normalized = ((((local + 180) % 360) + 360) % 360) - 180;
  return Math.round(normalized === -180 ? 180 : normalized);
}
