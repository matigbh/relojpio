import { useEffect, useState, type CSSProperties } from 'react';
import { describeEvent } from '../../core/format';
import { findPlayer } from '../../core/players';
import type { GameState, PlayerId } from '../../core/types';
import type { Settings } from '../../settings/settings';
import { CenterHub } from '../components/CenterHub';
import { Keypad, type KeypadRequest } from '../components/Keypad';
import { Oriented } from '../components/Oriented';
import { PauseMenu } from '../components/PauseMenu';
import { PlayerPanel } from '../components/PlayerPanel';
import { PlayerSheet } from '../components/PlayerSheet';
import { useGame } from '../hooks/useGame';
import { useGameFeedback } from '../hooks/useGameFeedback';
import { useWakeLock } from '../hooks/useWakeLock';
import { tableLayoutFor } from '../layout';

interface GameScreenProps {
  initialGame: GameState;
  settings: Settings;
  onSettingsChange: (settings: Settings) => void;
  onExit: () => void;
}

const TOAST_MS = 2500;

export function GameScreen({ initialGame, settings, onSettingsChange, onExit }: GameScreenProps) {
  const { state, now, actions } = useGame(initialGame);
  const [detailsFor, setDetailsFor] = useState<PlayerId | null>(null);
  const [keypad, setKeypad] = useState<KeypadRequest | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useGameFeedback(state, now, settings);
  useWakeLock(settings.keepAwake);

  useEffect(() => {
    if (toast == null) return;
    const id = window.setTimeout(() => setToast(null), TOAST_MS);
    return () => window.clearTimeout(id);
  }, [toast]);

  const layout = tableLayoutFor(state.players.length);
  const rotationOf = (playerId: PlayerId) => layout.seats[findPlayer(state.players, playerId)?.seat ?? 0].rotation;
  const detailsPlayer = detailsFor ? findPlayer(state.players, detailsFor) : undefined;

  const undoWithToast = () => {
    const last = state.history[state.history.length - 1];
    if (!last) return;
    setToast(`Deshecho: ${describeEvent(last.event, state.players)}`);
    actions.undo();
  };

  const openMenu = () => {
    actions.pause();
    setMenuOpen(true);
  };

  return (
    <main
      className="table"
      style={{ gridTemplateAreas: layout.areas, gridTemplateColumns: layout.columns, gridTemplateRows: layout.rows } as CSSProperties}
    >
      {state.players.map((player) => {
        const seat = layout.seats[player.seat];
        return (
          <div key={player.id} className="seat-cell" style={{ gridArea: seat.area }}>
            <Oriented rotation={seat.rotation} className="seat">
              <PlayerPanel
                player={player}
                game={state}
                now={now}
                onAdjustLife={(delta) => actions.adjustLife(player.id, delta)}
                onEditLife={() =>
                  setKeypad({
                    title: `Vida de ${player.name}`,
                    initialValue: player.life,
                    allowNegative: true,
                    rotation: seat.rotation,
                    onSubmit: (value) => actions.setLife(player.id, value),
                  })
                }
                onOpenDetails={() => setDetailsFor(player.id)}
                onPass={actions.passTurn}
                onActivate={() => actions.activatePlayer(player.id)}
              />
            </Oriented>
          </div>
        );
      })}

      <div className="hub-cell" style={{ gridArea: 'h' }}>
        <CenterHub
          direction={layout.hubDirection}
          paused={state.clock.paused}
          canUndo={state.history.length > 0}
          onPause={openMenu}
          onUndo={undoWithToast}
        />
      </div>

      {detailsPlayer && (
        <PlayerSheet
          player={detailsPlayer}
          players={state.players}
          rotation={rotationOf(detailsPlayer.id)}
          onAdjustDamage={(sourceId, delta) => actions.adjustCommanderDamage(detailsPlayer.id, sourceId, delta)}
          onSetDamage={(sourceId, value) => actions.setCommanderDamage(detailsPlayer.id, sourceId, value)}
          onRename={(info) => actions.updatePlayerInfo(detailsPlayer.id, info)}
          onSetEliminated={(eliminated) => actions.setEliminated(detailsPlayer.id, eliminated)}
          onRequestKeypad={setKeypad}
          onClose={() => setDetailsFor(null)}
        />
      )}

      {menuOpen && (
        <PauseMenu
          game={state}
          settings={settings}
          onSettingsChange={onSettingsChange}
          onResume={() => {
            actions.resume();
            setMenuOpen(false);
          }}
          onUndo={actions.undo}
          onRestart={() => {
            actions.restart();
            setMenuOpen(false);
          }}
          onExit={onExit}
        />
      )}

      {keypad && <Keypad {...keypad} onClose={() => setKeypad(null)} />}

      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </main>
  );
}
