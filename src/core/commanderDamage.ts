import { COMMANDER_DAMAGE_LETHAL } from './constants';
import { updatePlayer } from './players';
import type { Player, PlayerId } from './types';

export function getCommanderDamage(target: Player, sourceId: PlayerId): number {
  return target.commanderDamage[sourceId] ?? 0;
}

/**
 * Sets the total damage `target` has received from `sourceId`'s commander.
 * Totals never go below 0. Life is intentionally left untouched.
 */
export function setCommanderDamage(
  players: Player[],
  targetId: PlayerId,
  sourceId: PlayerId,
  total: number,
): Player[] {
  if (targetId === sourceId) return players;
  return updatePlayer(players, targetId, (p) => ({
    ...p,
    commanderDamage: { ...p.commanderDamage, [sourceId]: Math.max(0, Math.trunc(total)) },
  }));
}

export function adjustCommanderDamage(
  players: Player[],
  targetId: PlayerId,
  sourceId: PlayerId,
  delta: number,
): Player[] {
  const target = players.find((p) => p.id === targetId);
  if (!target) return players;
  return setCommanderDamage(players, targetId, sourceId, getCommanderDamage(target, sourceId) + delta);
}

/** Ids of every commander that has dealt lethal (21+) damage to `target`. */
export function lethalCommanderSources(target: Player): PlayerId[] {
  return Object.entries(target.commanderDamage)
    .filter(([, damage]) => damage >= COMMANDER_DAMAGE_LETHAL)
    .map(([sourceId]) => sourceId);
}
