/** Keys — a two-octave WebAudio piano with keyboard mapping and a demo song. */
import { h } from '../core/utils';
import { AppManifest, AppContext } from '../core/kernel';
import { icons } from '../icons';

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const KEYMAP = 'awsedftgyhujkolp;'; // a=C4 w=C#4 … through E5

const midiFreq = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

function launchPiano(ctx: AppContext) {
  let ac: AudioContext | null = null;
  let wave: OscillatorType = 'triangle';
  let volume = 0.5;
  const active = new Map<number, { osc: OscillatorNode; gain: GainNode }>();
  const keyEls = new Map<number, HTMLElement>();
  let demoTimer: ReturnType<typeof setTimeout> | null = null;

  const audio = () => {
    if (!ac) ac = new AudioContext();
    if (ac.state === 'suspended') void ac.resume();
    return ac;
  };

  function noteOn(midi: number) {
    if (active.has(midi)) return;
    const a = audio();
    const osc = a.createOscillator();
    const gain = a.createGain();
    osc.type = wave;
    osc.frequency.value = midiFreq(midi);
    const t = a.currentTime;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.22 * volume, t + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.12 * volume + 0.0001, t + 0.35);
    osc.connect(gain).connect(a.destination);
    osc.start();
    active.set(midi, { osc, gain });
    keyEls.get(midi)?.classList.add('down');
  }

  function noteOff(midi: number) {
    const v = active.get(midi);
    if (!v) return;
    active.delete(midi);
    const t = audio().currentTime;
    v.gain.gain.cancelScheduledValues(t);
    v.gain.gain.setValueAtTime(v.gain.gain.value, t);
    v.gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
    v.osc.stop(t + 0.3);
    keyEls.get(midi)?.classList.remove('down');
  }

  const allOff = () => [...active.keys()].forEach(noteOff);

  /* ---- build keyboard: C4 (60) to E5 (76) ---- */
  const startMidi = 60;
  const endMidi = 76;
  const board = h('div', { class: 'piano-board' });
  const whites: HTMLElement[] = [];
  for (let m = startMidi; m <= endMidi; m++) {
    const name = NOTE_NAMES[m % 12];
    const isBlack = name.includes('#');
    const key = h('div', {
      class: `pk ${isBlack ? 'black' : 'white'}`,
      dataset: { midi: String(m) },
    },
      h('span', { class: 'pk-label' },
        KEYMAP[m - startMidi] ? KEYMAP[m - startMidi].toUpperCase() : ''),
    );
    key.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      noteOn(m);
      const up = () => noteOff(m);
      window.addEventListener('pointerup', up, { once: true });
    });
    key.addEventListener('pointerenter', (e) => {
      if ((e as PointerEvent).buttons === 1) noteOn(m);
    });
    key.addEventListener('pointerleave', () => noteOff(m));
    keyEls.set(m, key);
    if (isBlack) {
      const lastWhite = whites[whites.length - 1];
      lastWhite.append(key);
    } else {
      board.append(key);
      whites.push(key);
    }
  }

  /* ---- controls ---- */
  const waveSel = h('select', { class: 'input piano-wave' },
    ...(['triangle', 'sine', 'square', 'sawtooth'] as const).map((w) =>
      h('option', { value: w, selected: w === wave ? 'selected' : null }, w)),
  );
  waveSel.addEventListener('change', () => { wave = waveSel.value as OscillatorType; });

  const volInput = h('input', { type: 'range', min: '0', max: '100', value: '50', title: 'Volume' });
  volInput.addEventListener('input', () => { volume = parseInt(volInput.value, 10) / 100; });

  const demoBtn = h('button', { class: 'btn' }, h('span', { class: 'btn-icon', html: icons.play }), 'Demo song');
  demoBtn.addEventListener('click', () => {
    if (demoTimer) { stopDemo(); return; }
    // Ode to Joy
    const seq: Array<[number, number]> = [
      [64, 1], [64, 1], [65, 1], [67, 1], [67, 1], [65, 1], [64, 1], [62, 1],
      [60, 1], [60, 1], [62, 1], [64, 1], [64, 1.5], [62, 0.5], [62, 2],
      [64, 1], [64, 1], [65, 1], [67, 1], [67, 1], [65, 1], [64, 1], [62, 1],
      [60, 1], [60, 1], [62, 1], [64, 1], [62, 1.5], [60, 0.5], [60, 2],
    ];
    demoBtn.textContent = 'Stop';
    let i = 0;
    const beat = 320;
    const step = () => {
      if (i >= seq.length) { stopDemo(); return; }
      const [m, dur] = seq[i++];
      noteOn(m);
      demoTimer = setTimeout(() => {
        noteOff(m);
        demoTimer = setTimeout(step, 30);
      }, dur * beat - 40);
    };
    step();
  });
  function stopDemo() {
    if (demoTimer) clearTimeout(demoTimer);
    demoTimer = null;
    allOff();
    demoBtn.innerHTML = '';
    demoBtn.append(h('span', { class: 'btn-icon', html: icons.play }), 'Demo song');
  }

  const root = h('div', { class: 'piano', tabindex: '0' },
    h('div', { class: 'piano-controls' },
      h('label', null, 'Wave '), waveSel,
      h('label', { style: { marginLeft: '14px' } }, 'Volume '), volInput,
      demoBtn,
      h('span', { class: 'piano-hint' }, 'Play with your keyboard: A W S E D F T G Y H U J K O L P ;'),
    ),
    board,
  );
  ctx.root.append(root);

  const downKeys = new Set<string>();
  root.addEventListener('keydown', (e) => {
    const i = KEYMAP.indexOf(e.key.toLowerCase());
    if (i >= 0 && !downKeys.has(e.key)) {
      downKeys.add(e.key);
      noteOn(startMidi + i);
      e.preventDefault();
    }
  });
  root.addEventListener('keyup', (e) => {
    const i = KEYMAP.indexOf(e.key.toLowerCase());
    if (i >= 0) {
      downKeys.delete(e.key);
      noteOff(startMidi + i);
    }
  });

  ctx.onClose(() => {
    stopDemo();
    allOff();
    void ac?.close();
  });
  setTimeout(() => root.focus(), 60);
}

export const pianoApp: AppManifest = {
  id: 'piano',
  name: 'Keys',
  icon: icons.piano,
  description: 'Two-octave synth piano',
  window: { width: 760, height: 330, minWidth: 620, minHeight: 300, resizable: true },
  launch: launchPiano,
};
