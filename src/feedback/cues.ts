import { lethalCommanderSources } from '../core/commanderDamage';
import { findPlayer } from '../core/players';
import type { GameState } from '../core/types';
import type { Cue } from './feedback';

/** Which cue (if any) a state transition deserves. Most important wins. */
export function cueForTransition(previous: GameState, next: GameState): Cue | null {
  const reachedLethal = next.players.some((p) => {
    const before = findPlayer(previous.players, p.id);
    return before != null && lethalCommanderSources(p).length > lethalCommanderSources(before).length;
  });
  if (reachedLethal) return 'lethal';

  const timedOut = next.players.some((p) => p.clock.timedOut && !findPlayer(previous.players, p.id)?.clock.timedOut);
  if (timedOut) return 'timeout';

  if (next.clock.activePlayerId != null && next.clock.activePlayerId !== previous.clock.activePlayerId) return 'turn';
  return null;
}
