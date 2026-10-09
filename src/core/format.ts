import { commanderLabel, findPlayer } from './players';
import type { GameEvent, Player } from './types';

/** MM:SS (or H:MM:SS past an hour). Rounds up so "0:00" only shows when time is truly out. */
export function formatClock(ms: number, roundUp = true): string {
  const totalSeconds = Math.max(0, roundUp ? Math.ceil(ms / 1000) : Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const ss = String(seconds).padStart(2, '0');
  if (hours > 0) return `${hours}:${String(minutes).padStart(2, '0')}:${ss}`;
  return `${String(minutes).padStart(2, '0')}:${ss}`;
}

export function formatTimeOfDay(timestamp: number): string {
  const date = new Date(timestamp);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

export function formatSigned(n: number): string {
  return n > 0 ? `+${n}` : n < 0 ? `−${Math.abs(n)}` : '0';
}

/** Human-readable (Spanish) description of a history event. */
export function describeEvent(event: GameEvent, players: Player[]): string {
  const nameOf = (id: string | null) => (id == null ? '—' : findPlayer(players, id)?.name ?? '?');
  switch (event.type) {
    case 'life': {
      const name = nameOf(event.playerId);
      if (event.setTo != null) return `${name}: vida fijada en ${event.result}`;
      const verb = event.delta < 0 ? 'pierde' : 'gana';
      return `${name} ${verb} ${Math.abs(event.delta)} de vida (${event.result})`;
    }
    case 'commanderDamage': {
      const target = nameOf(event.targetId);
      const source = findPlayer(players, event.sourceId);
      const label = source ? commanderLabel(source) : '?';
      if (event.setTo != null) return `Daño de ${label} a ${target} fijado en ${event.result}`;
      if (event.delta > 0) return `${target} recibe ${event.delta} de daño de comandante de ${label} (${event.result})`;
      return `Corrección: daño de ${label} a ${target} ${formatSigned(event.delta)} (${event.result})`;
    }
    case 'turn':
      return event.fromId == null
        ? `Empieza ${nameOf(event.toId)}`
        : `Cambio de turno: ${nameOf(event.fromId)} → ${nameOf(event.toId)}`;
    case 'eliminated':
      return event.eliminated ? `${nameOf(event.playerId)} queda eliminado` : `${nameOf(event.playerId)} vuelve a la partida`;
  }
}
