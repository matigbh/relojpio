import { useEffect, useState } from 'react';

/** True for `durationMs` every time `key` changes to a non-null value. */
export function useFlash(key: string | null, durationMs: number): boolean {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (key == null) {
      setVisible(false);
      return;
    }
    setVisible(true);
    const id = window.setTimeout(() => setVisible(false), durationMs);
    return () => window.clearTimeout(id);
  }, [key, durationMs]);
  return visible;
}
