interface CenterHubProps {
  direction: 'row' | 'column';
  paused: boolean;
  canUndo: boolean;
  onPause: () => void;
  onUndo: () => void;
}

/** Shared controls in the middle of the table. Symbols only, so they read from every seat. */
export function CenterHub({ direction, paused, canUndo, onPause, onUndo }: CenterHubProps) {
  return (
    <nav className="hub" data-direction={direction}>
      <button className="hub-btn" onClick={onUndo} disabled={!canUndo} aria-label="Deshacer">
        ↶
      </button>
      <button className="hub-btn main" data-paused={paused || undefined} onClick={onPause} aria-label={paused ? 'Menú / continuar' : 'Pausa y menú'}>
        {paused ? '▶' : '❚❚'}
      </button>
    </nav>
  );
}
