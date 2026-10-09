import { describeEvent, formatTimeOfDay } from '../../core/format';
import type { HistoryEntry, Player } from '../../core/types';

interface HistoryListProps {
  history: HistoryEntry[];
  players: Player[];
}

export function HistoryList({ history, players }: HistoryListProps) {
  if (history.length === 0) return <p className="empty">Todavía no hay acciones.</p>;
  return (
    <ol className="history">
      {[...history].reverse().map((entry) => (
        <li key={entry.id}>
          <time>{formatTimeOfDay(entry.at)}</time>
          <span>{describeEvent(entry.event, players)}</span>
        </li>
      ))}
    </ol>
  );
}
