import type { CSSProperties } from 'react';
import { getCommanderDamage, lethalCommanderSources } from '../../core/commanderDamage';
import { COMMANDER_DAMAGE_LETHAL, HISTORY_MERGE_WINDOW_MS, lowTimeThresholdMs } from '../../core/constants';
import { formatClock, formatSigned } from '../../core/format';
import { commanderLabel, findPlayer, opponentsOf } from '../../core/players';
import { getLiveClock } from '../../core/timer';
import type { GameState, HistoryEntry, Player } from '../../core/types';
import { useFlash } from '../hooks/useFlash';

interface PlayerPanelProps {
  player: Player;
  game: GameState;
  now: number;
  onAdjustLife: (delta: number) => void;
  onEditLife: () => void;
  onOpenDetails: () => void;
  onPass: () => void;
  onActivate: () => void;
}

const LOSS_STEPS = [-5, -1];
const GAIN_STEPS = [1, 5];

/** Key for the "+3/−3" bubble: changes whenever this player's latest life burst changes. */
function lifeFlashKey(entry: HistoryEntry | undefined, player: Player): { key: string | null; delta: number } {
  if (!entry || entry.event.type !== 'life' || entry.event.playerId !== player.id || entry.event.setTo != null) {
    return { key: null, delta: 0 };
  }
  return { key: `${entry.id}:${entry.event.delta}`, delta: entry.event.delta };
}

export function PlayerPanel({ player, game, now, onAdjustLife, onEditLife, onOpenDetails, onPass, onActivate }: PlayerPanelProps) {
  const { clock, config, players } = game;
  const isActive = clock.activePlayerId === player.id;
  const gameStarted = clock.activePlayerId != null;
  const live = getLiveClock(player, clock, now);
  const unlimited = live.remainingMs == null;
  const threshold = lowTimeThresholdMs(config.initialTimeMs);
  const isLowTime = !unlimited && threshold != null && live.remainingMs! > 0 && live.remainingMs! <= threshold;
  const lethalSources = lethalCommanderSources(player);

  const lastEntry = game.history[game.history.length - 1];
  const flash = lifeFlashKey(lastEntry, player);
  const showDelta = useFlash(flash.key, HISTORY_MERGE_WINDOW_MS);

  const badges: { text: string; tone: 'danger' | 'warn' }[] = [];
  for (const sourceId of lethalSources) {
    const source = findPlayer(players, sourceId);
    badges.push({ text: `☠ ${COMMANDER_DAMAGE_LETHAL}+ de ${source ? commanderLabel(source) : '?'}`, tone: 'danger' });
  }
  if (player.clock.timedOut) badges.push({ text: 'SIN TIEMPO', tone: 'warn' });
  if (player.life <= 0) badges.push({ text: 'VIDA ≤ 0', tone: 'danger' });

  const renderStep = (delta: number) => (
    <button
      key={delta}
      className="life-btn"
      data-big={Math.abs(delta) === 1 || undefined}
      onClick={() => onAdjustLife(delta)}
      aria-label={`${formatSigned(delta)} vida`}
    >
      {formatSigned(delta)}
    </button>
  );

  return (
    <section
      className="panel"
      style={{ '--pc': player.color } as CSSProperties}
      data-active={isActive || undefined}
      data-low={isLowTime || undefined}
      data-timeout={player.clock.timedOut || undefined}
      data-eliminated={player.eliminated || undefined}
      data-paused={(isActive && clock.paused) || undefined}
    >
      <header className="panel-head">
        <button className="panel-id" onClick={onOpenDetails}>
          <span className="panel-name">{player.name}</span>
          {player.commanderName && <span className="panel-cmdr">{player.commanderName}</span>}
        </button>
        <button className="cd-chips" onClick={onOpenDetails} aria-label="Daño de comandante">
          <span className="cd-icon" aria-hidden>⚔</span>
          {opponentsOf(players, player.id).map((opponent) => {
            const damage = getCommanderDamage(player, opponent.id);
            return (
              <span
                key={opponent.id}
                className="cd-chip"
                style={{ '--oc': opponent.color } as CSSProperties}
                data-zero={damage === 0 || undefined}
                data-lethal={damage >= COMMANDER_DAMAGE_LETHAL || undefined}
              >
                {damage}
              </span>
            );
          })}
        </button>
      </header>

      {badges.length > 0 && (
        <div className="panel-badges">
          {badges.map((badge) => (
            <span key={badge.text} className="badge" data-tone={badge.tone}>
              {badge.text}
            </span>
          ))}
        </div>
      )}

      <div className="life-row">
        {LOSS_STEPS.map(renderStep)}
        <button className="life-value" onClick={onEditLife} aria-label="Introducir vida">
          <span className="life-number">{player.life}</span>
          {showDelta && flash.delta !== 0 && (
            <span className="life-delta" data-negative={flash.delta < 0 || undefined}>
              {formatSigned(flash.delta)}
            </span>
          )}
        </button>
        {GAIN_STEPS.map(renderStep)}
      </div>

      <footer className="panel-foot">
        <button
          className="clock"
          onClick={isActive ? undefined : onActivate}
          aria-label={isActive ? 'Tiempo restante' : `Dar el turno a ${player.name}`}
          data-unlimited={unlimited || undefined}
        >
          {isActive && <span className="clock-turn">{clock.paused ? '⏸ PAUSA' : 'TURNO'}</span>}
          <span className="clock-time">{formatClock(unlimited ? live.usedMs : live.remainingMs!, !unlimited)}</span>
          {unlimited && <span className="clock-tag">usado</span>}
        </button>
        {isActive ? (
          <button className="pass-btn" onClick={onPass}>
            Pasar turno <span aria-hidden>➜</span>
          </button>
        ) : (
          !gameStarted && (
            <button className="pass-btn start" onClick={onActivate}>
              ▶ Empiezo yo
            </button>
          )
        )}
      </footer>

      {player.eliminated && (
        <button className="panel-eliminated" onClick={onOpenDetails}>
          <strong>ELIMINADO</strong>
          <small>Toca para gestionar</small>
        </button>
      )}
    </section>
  );
}
