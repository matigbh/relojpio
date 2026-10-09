import { useState } from 'react';
import type { Rotation } from '../layout';
import { Overlay } from './Overlay';

export interface KeypadRequest {
  title: string;
  initialValue: number;
  allowNegative: boolean;
  rotation: Rotation;
  onSubmit: (value: number) => void;
}

interface KeypadProps extends KeypadRequest {
  onClose: () => void;
}

const MAX_DIGITS = 4;
const DIGITS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

/** Numeric entry that rotates with the player (the system keyboard would not). */
export function Keypad({ title, initialValue, allowNegative, rotation, onSubmit, onClose }: KeypadProps) {
  const [digits, setDigits] = useState('');
  const [negative, setNegative] = useState(false);

  const typed = digits !== '';
  const display = typed ? `${negative ? '−' : ''}${digits}` : String(initialValue);
  const press = (digit: string) => setDigits((d) => (d.length >= MAX_DIGITS ? d : (d + digit).replace(/^0+(?=\d)/, '')));
  const submit = () => {
    if (typed) onSubmit((negative ? -1 : 1) * Number(digits));
    onClose();
  };

  return (
    <Overlay rotation={rotation} onDismiss={onClose} className="keypad">
      <div className="keypad-title">{title}</div>
      <div className="keypad-display" data-placeholder={!typed || undefined}>
        {display}
      </div>
      <div className="keypad-grid">
        {DIGITS.map((digit) => (
          <button key={digit} onClick={() => press(digit)}>
            {digit}
          </button>
        ))}
        <button onClick={() => setNegative((n) => !n)} disabled={!allowNegative} aria-label="Cambiar signo">
          ±
        </button>
        <button onClick={() => press('0')}>0</button>
        <button onClick={() => setDigits((d) => d.slice(0, -1))} aria-label="Borrar">
          ⌫
        </button>
      </div>
      <div className="keypad-actions">
        <button className="btn ghost" onClick={onClose}>
          Cancelar
        </button>
        <button className="btn primary" onClick={submit}>
          OK
        </button>
      </div>
    </Overlay>
  );
}
