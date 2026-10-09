import { useState } from 'react';
import { describeEvent } from '../../core/format';
import type { GameState } from '../../core/types';
import type { Settings } from '../../settings/settings';
import { HistoryList } from './HistoryList';
import { Overlay } from './Overlay';
import { SettingsPanel } from './SettingsPanel';

type View = 'main' | 'history' | 'settings' | 'confirmRestart' | 'confirmExit';

interface PauseMenuProps {
  game: GameState;
  settings: Settings;
  onSettingsChange: (settings: Settings) => void;
  onResume: () => void;
  onUndo: () => void;
  onRestart: () => void;
  onExit: () => void;
}

export function PauseMenu({ game, settings, onSettingsChange, onResume, onUndo, onRestart, onExit }: PauseMenuProps) {
  const [view, setView] = useState<View>('main');
  const lastEntry = game.history[game.history.length - 1];
  const back = () => setView('main');

  return (
    <Overlay className="menu" onDismiss={view === 'main' ? onResume : back}>
      {view === 'main' && (
        <>
          <h2 className="menu-title">Partida en pausa</h2>
          <button className="btn primary big" onClick={onResume}>
            ▶ Continuar
          </button>
          <button className="btn" onClick={onUndo} disabled={!lastEntry}>
            ↶ Deshacer
            {lastEntry && <small>{describeEvent(lastEntry.event, game.players)}</small>}
          </button>
          {settings.historyEnabled && (
            <button className="btn" onClick={() => setView('history')}>
              Historial ({game.history.length})
            </button>
          )}
          <button className="btn" onClick={() => setView('settings')}>
            Ajustes
          </button>
          <div className="menu-row">
            <button className="btn danger" onClick={() => setView('confirmRestart')}>
              Reiniciar
            </button>
            <button className="btn danger" onClick={() => setView('confirmExit')}>
              Salir
            </button>
          </div>
        </>
      )}

      {view === 'history' && (
        <>
          <MenuHeader title="Historial" onBack={back} />
          <button className="btn" onClick={onUndo} disabled={!lastEntry}>
            ↶ Deshacer última acción
          </button>
          <HistoryList history={game.history} players={game.players} />
        </>
      )}

      {view === 'settings' && (
        <>
          <MenuHeader title="Ajustes" onBack={back} />
          <SettingsPanel settings={settings} onChange={onSettingsChange} />
        </>
      )}

      {view === 'confirmRestart' && (
        <Confirm
          title="¿Reiniciar la partida?"
          body="Se restablecen vida, daño de comandante y relojes. Se mantienen jugadores y comandantes."
          confirmLabel="Reiniciar"
          onConfirm={onRestart}
          onCancel={back}
        />
      )}

      {view === 'confirmExit' && (
        <Confirm
          title="¿Salir de la partida?"
          body="La partida actual se descarta y vuelves a la configuración."
          confirmLabel="Salir"
          onConfirm={onExit}
          onCancel={back}
        />
      )}
    </Overlay>
  );
}

function MenuHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className="menu-header">
      <button className="icon-btn" onClick={onBack} aria-label="Volver">
        ‹
      </button>
      <h2>{title}</h2>
    </div>
  );
}

interface ConfirmProps {
  title: string;
  body: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

function Confirm({ title, body, confirmLabel, onConfirm, onCancel }: ConfirmProps) {
  return (
    <>
      <h2 className="menu-title">{title}</h2>
      <p className="menu-body">{body}</p>
      <div className="menu-row">
        <button className="btn" onClick={onCancel}>
          Cancelar
        </button>
        <button className="btn danger" onClick={onConfirm}>
          {confirmLabel}
        </button>
      </div>
    </>
  );
}
