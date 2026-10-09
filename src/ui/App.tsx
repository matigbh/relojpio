import { useEffect, useState } from 'react';
import { createGame } from '../core/gameReducer';
import type { GameState } from '../core/types';
import { unlockAudio } from '../feedback/feedback';
import { gameStorage } from '../persistence/gameStorage';
import { settingsStorage, type Settings } from '../settings/settings';
import { setupStorage, setupToConfig, type SetupPreferences } from '../settings/setupPreferences';
import { GameScreen } from './screens/GameScreen';
import { SetupScreen } from './screens/SetupScreen';

export function App() {
  const [settings, setSettings] = useState<Settings>(settingsStorage.load);
  const [setup, setSetup] = useState<SetupPreferences>(setupStorage.load);
  // An unfinished game is restored straight away (e.g. after the phone locked or the app was closed).
  const [game, setGame] = useState<GameState | null>(gameStorage.load);

  useEffect(() => {
    document.documentElement.dataset.theme = settings.theme;
    settingsStorage.save(settings);
  }, [settings]);

  useEffect(() => setupStorage.save(setup), [setup]);

  useEffect(() => {
    window.addEventListener('pointerdown', unlockAudio, { once: true });
    return () => window.removeEventListener('pointerdown', unlockAudio);
  }, []);

  const startGame = () => {
    const newGame = createGame(setupToConfig(setup), Date.now());
    gameStorage.save(newGame);
    setGame(newGame);
  };

  const exitGame = () => {
    gameStorage.clear();
    setGame(null);
  };

  if (game) {
    return <GameScreen initialGame={game} settings={settings} onSettingsChange={setSettings} onExit={exitGame} />;
  }
  return <SetupScreen setup={setup} onSetupChange={setSetup} settings={settings} onSettingsChange={setSettings} onStart={startGame} />;
}
