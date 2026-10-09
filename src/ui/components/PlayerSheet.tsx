import type { CSSProperties } from 'react';
import { getCommanderDamage } from '../../core/commanderDamage';
import { COMMANDER_DAMAGE_LETHAL } from '../../core/constants';
import { formatSigned } from '../../core/format';
import { commanderLabel, opponentsOf } from '../../core/players';
import type { Player } from '../../core/types';
import type { Rotation } from '../layout';
import type { KeypadRequest } from './Keypad';
import { Overlay } from './Overlay';

interface PlayerSheetProps {
  player: Player;
  players: Player[];
  rotation: Rotation;
  onAdjustDamage: (sourceId: string, delta: number) => void;
  onSetDamage: (sourceId: string, value: number) => void;
  onRename: (info: { name?: string; commanderName?: string }) => void;
  onSetEliminated: (eliminated: boolean) => void;
  onRequestKeypad: (request: KeypadRequest) => void;
  onClose: () => void;
}

const DAMAGE_STEPS = [-5, -1, 1, 5];

/** Commander damage received by one player, plus their name/commander and elimination toggle. */
export function PlayerSheet({
  player,
  players,
  rotation,
  onAdjustDamage,
  onSetDamage,
  onRename,
  onSetEliminated,
  onRequestKeypad,
  onClose,
}: PlayerSheetProps) {
  return (
    <Overlay rotation={rotation} onDismiss={onClose} className="sheet">
      <header className="sheet-head" style={{ '--pc': player.color } as CSSProperties}>
        <div className="sheet-fields">
          <input
            className="input name-input"
            value={player.name}
            onChange={(e) => onRename({ name: e.target.value })}
            aria-label="Nombre del jugador"
          />
          <input
            className="input"
            value={player.commanderName}
            placeholder="Comandante"
            onChange={(e) => onRename({ commanderName: e.target.value })}
            aria-label="Comandante"
          />
        </div>
        <div className="sheet-life">
          <small>Vida</small>
          <strong>{player.life}</strong>
        </div>
        <button className="icon-btn" onClick={onClose} aria-label="Cerrar">
          ✕
        </button>
      </header>

      <h3 className="sheet-title">Daño de comandante recibido</h3>
      <ul className="cd-list">
        {opponentsOf(players, player.id).map((source) => {
          const damage = getCommanderDamage(player, source.id);
          const lethal = damage >= COMMANDER_DAMAGE_LETHAL;
          const label = commanderLabel(source);
          return (
            <li key={source.id} className="cd-row" data-lethal={lethal || undefined} style={{ '--oc': source.color } as CSSProperties}>
              <div className="cd-source">
                <span className="cd-name">{label}</span>
                {source.commanderName && <small>{source.name}</small>}
              </div>
              <div className="cd-controls">
                {DAMAGE_STEPS.slice(0, 2).map((delta) => (
                  <button key={delta} className="step-btn" onClick={() => onAdjustDamage(source.id, delta)}>
                    {formatSigned(delta)}
                  </button>
                ))}
                <button
                  className="cd-value"
                  onClick={() =>
                    onRequestKeypad({
                      title: `Daño de ${label} a ${player.name}`,
                      initialValue: damage,
                      allowNegative: false,
                      rotation,
                      onSubmit: (value) => onSetDamage(source.id, value),
                    })
                  }
                  aria-label={`Introducir daño de ${label}`}
                >
                  {damage}
                  {lethal && <small>LETAL</small>}
                </button>
                {DAMAGE_STEPS.slice(2).map((delta) => (
                  <button key={delta} className="step-btn" onClick={() => onAdjustDamage(source.id, delta)}>
                    {formatSigned(delta)}
                  </button>
                ))}
              </div>
            </li>
          );
        })}
      </ul>
      <p className="sheet-note">
        El daño de comandante no modifica la vida. Con {COMMANDER_DAMAGE_LETHAL}+ de un mismo comandante se muestra una alerta.
      </p>

      <footer className="sheet-foot">
        <button className={`btn ${player.eliminated ? 'primary' : 'danger'}`} onClick={() => onSetEliminated(!player.eliminated)}>
          {player.eliminated ? 'Volver a la partida' : 'Marcar eliminado'}
        </button>
        <button className="btn" onClick={onClose}>
          Listo
        </button>
      </footer>
    </Overlay>
  );
}
