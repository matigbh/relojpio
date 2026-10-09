import type { ReactNode } from 'react';
import type { Rotation } from '../layout';
import { Oriented } from './Oriented';

interface OverlayProps {
  rotation?: Rotation;
  onDismiss?: () => void;
  className?: string;
  children: ReactNode;
}

/** Full-screen modal layer, rotated to face the player who opened it. */
export function Overlay({ rotation = 0, onDismiss, className, children }: OverlayProps) {
  return (
    <div className="overlay">
      <Oriented rotation={rotation} className="overlay-frame">
        <div className="overlay-scrim" onClick={onDismiss} />
        <div className={`overlay-card ${className ?? ''}`} role="dialog" aria-modal="true">
          {children}
        </div>
      </Oriented>
    </div>
  );
}
