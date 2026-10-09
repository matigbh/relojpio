import { updatePlayer } from './players';
import type { Player, PlayerId } from './types';

/** Life can go negative, as in the real game; the app never eliminates automatically. */
export function setLife(players: Player[], playerId: PlayerId, life: number): Player[] {
  return updatePlayer(players, playerId, (p) => ({ ...p, life: Math.trunc(life) }));
}

export function adjustLife(players: Player[], playerId: PlayerId, delta: number): Player[] {
  return updatePlayer(players, playerId, (p) => ({ ...p, life: p.life + Math.trunc(delta) }));
}

export function isAtOrBelowZeroLife(player: Player): boolean {
  return player.life <= 0;
}
