import type { GameConfig, Player, PlayerId } from './types';

export function playerIdForSeat(seat: number): PlayerId {
  return `p${seat + 1}`;
}

export function createPlayers(config: GameConfig): Player[] {
  return config.players.map((setup, seat) => ({
    id: playerIdForSeat(seat),
    seat,
    name: setup.name.trim() || `Jugador ${seat + 1}`,
    commanderName: setup.commanderName.trim(),
    color: setup.color,
    life: config.startingLife,
    commanderDamage: {},
    eliminated: false,
    clock: { remainingMs: config.initialTimeMs, usedMs: 0, timedOut: false },
  }));
}

export function findPlayer(players: Player[], id: PlayerId): Player | undefined {
  return players.find((p) => p.id === id);
}

export function updatePlayer(
  players: Player[],
  id: PlayerId,
  update: (player: Player) => Player,
): Player[] {
  return players.map((p) => (p.id === id ? update(p) : p));
}

/** Label for a player's commander, falling back to the player name when none was entered. */
export function commanderLabel(player: Player): string {
  return player.commanderName || player.name;
}

/** Next player clockwise that is still in the game. Returns `currentId` if nobody else is. */
export function nextPlayerId(players: Player[], currentId: PlayerId | null): PlayerId | null {
  const bySeat = [...players].sort((a, b) => a.seat - b.seat);
  if (bySeat.length === 0) return null;
  const currentIndex = currentId == null ? -1 : bySeat.findIndex((p) => p.id === currentId);
  for (let step = 1; step <= bySeat.length; step++) {
    const candidate = bySeat[(currentIndex + step + bySeat.length) % bySeat.length];
    if (!candidate.eliminated) return candidate.id;
  }
  return currentId;
}

export function opponentsOf(players: Player[], id: PlayerId): Player[] {
  return players.filter((p) => p.id !== id);
}
