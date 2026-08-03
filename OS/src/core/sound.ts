/** Minimal WebAudio synth for system sounds. */
import { settings } from './settings';

let ctx: AudioContext | null = null;

function audio(): AudioContext | null {
  if (!settings.get('sounds')) return null;
  // Browsers block audio before the first user gesture — don't even try.
  if (!ctx && !(navigator as { userActivation?: { hasBeenActive: boolean } }).userActivation?.hasBeenActive) return null;
  try {
    if (!ctx) ctx = new AudioContext();
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

export function tone(freq: number, dur = 0.12, type: OscillatorType = 'sine', vol = 0.08, when = 0) {
  const ac = audio();
  if (!ac) return;
  const t0 = ac.currentTime + when;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(vol, t0 + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

export const sfx = {
  /** Startup chime: gentle rising arpeggio. */
  chime() {
    tone(392, 0.5, 'sine', 0.05, 0);
    tone(523.25, 0.5, 'sine', 0.05, 0.12);
    tone(659.25, 0.6, 'sine', 0.05, 0.24);
    tone(783.99, 0.9, 'sine', 0.045, 0.36);
  },
  notify() { tone(880, 0.1, 'sine', 0.05); tone(1174.66, 0.18, 'sine', 0.04, 0.08); },
  error() { tone(220, 0.18, 'square', 0.035); tone(174, 0.22, 'square', 0.03, 0.1); },
  tap() { tone(1500, 0.04, 'sine', 0.02); },
};
