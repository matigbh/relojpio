import { useState, type CSSProperties } from 'react';
import { MAX_PLAYERS, MIN_PLAYERS } from '../../core/constants';
import type { PlayerSetup } from '../../core/types';
import type { Settings } from '../../settings/settings';
import {
  INCREMENT_PRESETS_SEC,
  PLAYER_COLORS,
  TIME_PRESETS_MIN,
  type SetupPreferences,
  type TimeChoice,
} from '../../settings/setupPreferences';
import { Segmented } from '../components/controls';
import { SettingsPanel } from '../components/SettingsPanel';

interface SetupScreenProps {
  setup: SetupPreferences;
  onSetupChange: (setup: SetupPreferences) => void;
  settings: Settings;
  onSettingsChange: (settings: Settings) => void;
  onStart: () => void;
}

const PLAYER_COUNTS = Array.from({ length: MAX_PLAYERS - MIN_PLAYERS + 1 }, (_, i) => MIN_PLAYERS + i);
const LIFE_PRESETS = [20, 30, 40];

const TIME_OPTIONS: { value: TimeChoice; label: string }[] = [
  ...TIME_PRESETS_MIN.map((m) => ({ value: m as TimeChoice, label: `${m}′` })),
  { value: 'unlimited', label: '∞' },
  { value: 'custom', label: 'Otro' },
];

const INCREMENT_OPTIONS = INCREMENT_PRESETS_SEC.map((s) => ({ value: s as number, label: s === 0 ? 'Sin' : `+${s}s` }));

export function SetupScreen({ setup, onSetupChange, settings, onSettingsChange, onStart }: SetupScreenProps) {
  const [colorPickerFor, setColorPickerFor] = useState<number | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  const update = (patch: Partial<SetupPreferences>) => onSetupChange({ ...setup, ...patch });
  const updateSeat = (index: number, patch: Partial<PlayerSetup>) =>
    update({ seats: setup.seats.map((seat, i) => (i === index ? { ...seat, ...patch } : seat)) });

  return (
    <main className="setup">
      <header className="setup-header">
        <div className="brand">
          <img src="./icon.svg" alt="" width={36} height={36} />
          <div>
            <h1>Mesa Commander</h1>
            <small>Reloj · Vida · Daño de comandante</small>
          </div>
        </div>
        <button className="icon-btn" onClick={() => setShowSettings((s) => !s)} aria-label="Ajustes" aria-expanded={showSettings}>
          ⚙
        </button>
      </header>

      {showSettings && (
        <section className="card">
          <h2>Ajustes</h2>
          <SettingsPanel settings={settings} onChange={onSettingsChange} />
        </section>
      )}

      <section className="card">
        <h2>Jugadores</h2>
        <Segmented
          label="Número de jugadores"
          value={setup.playerCount}
          options={PLAYER_COUNTS.map((n) => ({ value: n, label: String(n) }))}
          onChange={(playerCount) => update({ playerCount })}
        />
        <ol className="seat-list">
          {setup.seats.slice(0, setup.playerCount).map((seat, index) => (
            <li key={index} className="seat-row" style={{ '--pc': seat.color } as CSSProperties}>
              <button
                className="swatch"
                onClick={() => setColorPickerFor(colorPickerFor === index ? null : index)}
                aria-label={`Color de ${seat.name}`}
              />
              <div className="seat-fields">
                <input
                  className="input"
                  value={seat.name}
                  placeholder={`Jugador ${index + 1}`}
                  onChange={(e) => updateSeat(index, { name: e.target.value })}
                  aria-label={`Nombre del jugador ${index + 1}`}
                />
                <input
                  className="input"
                  value={seat.commanderName}
                  placeholder="Comandante"
                  onChange={(e) => updateSeat(index, { commanderName: e.target.value })}
                  aria-label={`Comandante del jugador ${index + 1}`}
                />
              </div>
              {colorPickerFor === index && (
                <div className="palette">
                  {PLAYER_COLORS.map((color) => (
                    <button
                      key={color}
                      className="swatch"
                      style={{ '--pc': color } as CSSProperties}
                      data-selected={color === seat.color || undefined}
                      onClick={() => {
                        updateSeat(index, { color });
                        setColorPickerFor(null);
                      }}
                      aria-label={`Elegir color ${color}`}
                    />
                  ))}
                </div>
              )}
            </li>
          ))}
        </ol>
        <p className="hint">El orden es el de turno (sentido horario). El jugador 1 se sienta abajo.</p>
      </section>

      <section className="card">
        <h2>Vida inicial</h2>
        <div className="stepper">
          <button className="step-btn" onClick={() => update({ startingLife: Math.max(1, setup.startingLife - 1) })}>
            −
          </button>
          <input
            className="input number"
            type="number"
            inputMode="numeric"
            value={setup.startingLife}
            onChange={(e) => update({ startingLife: Math.max(1, Number(e.target.value) || 1) })}
            aria-label="Vida inicial"
          />
          <button className="step-btn" onClick={() => update({ startingLife: setup.startingLife + 1 })}>
            +
          </button>
          {LIFE_PRESETS.map((life) => (
            <button key={life} className="chip" data-selected={setup.startingLife === life || undefined} onClick={() => update({ startingLife: life })}>
              {life}
            </button>
          ))}
        </div>
      </section>

      <section className="card">
        <h2>Tiempo por jugador</h2>
        <Segmented label="Tiempo por jugador" value={setup.timeChoice} options={TIME_OPTIONS} onChange={(timeChoice) => update({ timeChoice })} />
        {setup.timeChoice === 'custom' && (
          <label className="inline-field">
            <input
              className="input number"
              type="number"
              inputMode="numeric"
              min={1}
              value={setup.customMinutes}
              onChange={(e) => update({ customMinutes: Math.max(1, Number(e.target.value) || 1) })}
            />
            minutos
          </label>
        )}
        {setup.timeChoice !== 'unlimited' && (
          <>
            <h3>Incremento por turno</h3>
            <Segmented
              label="Incremento"
              value={setup.incrementSeconds}
              options={INCREMENT_OPTIONS}
              onChange={(incrementSeconds) => update({ incrementSeconds })}
            />
          </>
        )}
      </section>

      <button className="btn primary big start-game" onClick={onStart}>
        Comenzar partida
      </button>
    </main>
  );
}
