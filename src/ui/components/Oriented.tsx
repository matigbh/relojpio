import type { ReactNode } from 'react';
import type { Rotation } from '../layout';

interface OrientedProps {
  rotation: Rotation;
  className?: string;
  children: ReactNode;
}

/**
 * Rotates its content to face a seat. For 90°/270° the inner box swaps width and height
 * (via container query units) so content lays out in the rotated frame, not the screen's.
 */
export function Oriented({ rotation, className, children }: OrientedProps) {
  return (
    <div className={`oriented ${className ?? ''}`} data-rotation={rotation}>
      <div className="oriented-inner">{children}</div>
    </div>
  );
}
