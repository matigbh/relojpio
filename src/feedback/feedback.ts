/**
 * Sound and haptic cues. Sounds are synthesized with the Web Audio API (no audio assets),
 * so they work offline and carry no third-party branding.
 *
 * Note: `navigator.vibrate` is supported on Android browsers but not on iOS Safari,
 * where vibration silently does nothing.
 */

export type Cue = 'turn' | 'lowTime' | 'timeout' | 'lethal';

interface Tone {
  frequency: number;
  durationMs: number;
  delayMs?: number;
  type?: OscillatorType;
}

const TONES: Record<Cue, Tone[]> = {
  turn: [{ frequency: 660, durationMs: 90 }],
  lowTime: [
    { frequency: 880, durationMs: 120 },
    { frequency: 880, durationMs: 120, delayMs: 200 },
  ],
  timeout: [
    { frequency: 520, durationMs: 220, type: 'square' },
    { frequency: 390, durationMs: 420, delayMs: 260, type: 'square' },
  ],
  lethal: [
    { frequency: 330, durationMs: 160, type: 'sawtooth' },
    { frequency: 440, durationMs: 160, delayMs: 180, type: 'sawtooth' },
    { frequency: 660, durationMs: 320, delayMs: 360, type: 'sawtooth' },
  ],
};

const VIBRATION_PATTERNS: Record<Cue, number[]> = {
  turn: [40],
  lowTime: [120, 80, 120],
  timeout: [400, 120, 400],
  lethal: [200, 80, 200, 80, 400],
};

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (audioContext) return audioContext;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  audioContext = new Ctor();
  return audioContext;
}

/** iOS only allows audio after a user gesture; call this from the first tap. */
export function unlockAudio(): void {
  const ctx = getAudioContext();
  if (ctx && ctx.state === 'suspended') void ctx.resume();
}

function playTones(tones: Tone[]): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  for (const tone of tones) {
    const start = ctx.currentTime + (tone.delayMs ?? 0) / 1000;
    const end = start + tone.durationMs / 1000;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = tone.type ?? 'sine';
    oscillator.frequency.value = tone.frequency;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.25, start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, end);
    oscillator.connect(gain).connect(ctx.destination);
    oscillator.start(start);
    oscillator.stop(end + 0.02);
  }
}

export function playCue(cue: Cue, options: { sound: boolean; vibration: boolean }): void {
  if (options.sound) playTones(TONES[cue]);
  if (options.vibration && 'vibrate' in navigator) navigator.vibrate(VIBRATION_PATTERNS[cue]);
}
