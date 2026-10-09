import type { Settings, ThemeName } from '../../settings/settings';
import { Segmented, Toggle } from './controls';

interface SettingsPanelProps {
  settings: Settings;
  onChange: (settings: Settings) => void;
}

const THEMES: { value: ThemeName; label: string }[] = [
  { value: 'dark', label: 'Oscuro' },
  { value: 'light', label: 'Claro' },
  { value: 'contrast', label: 'Alto contraste' },
];

export function SettingsPanel({ settings, onChange }: SettingsPanelProps) {
  const set = <K extends keyof Settings>(key: K, value: Settings[K]) => onChange({ ...settings, [key]: value });
  return (
    <div className="settings">
      <div className="field">
        <span className="field-label">Tema</span>
        <Segmented label="Tema" value={settings.theme} options={THEMES} onChange={(v) => set('theme', v)} />
      </div>
      <Toggle label="Sonido" checked={settings.sound} onChange={(v) => set('sound', v)} />
      <Toggle label="Vibración" hint="No disponible en iPhone (Safari)" checked={settings.vibration} onChange={(v) => set('vibration', v)} />
      <Toggle label="Historial de acciones" hint="Deshacer funciona siempre" checked={settings.historyEnabled} onChange={(v) => set('historyEnabled', v)} />
      <Toggle label="Mantener pantalla encendida" checked={settings.keepAwake} onChange={(v) => set('keepAwake', v)} />
    </div>
  );
}
