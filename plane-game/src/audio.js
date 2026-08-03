// Fully procedural WebAudio: piston/jet engine voices, slipstream, tyre
// rumble, stall horn, touchdown thumps, crash. No audio assets required.

import { clamp, lerp } from './util.js';

export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.ready = false;
    this.engineType = 'piston';
    this.pulsesPerRev = 2;
  }

  init() {
    if (this.ready) { this.ctx.resume(); return; }
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.ctx = ctx;

    this.master = ctx.createGain();
    this.master.gain.value = 0.0;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16;
    comp.ratio.value = 6;
    this.master.connect(comp);
    comp.connect(ctx.destination);

    // shared looping noise
    const len = ctx.sampleRate * 2;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    this.noiseBuf = buf;

    const noise = (dest) => {
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      src.connect(dest);
      src.start();
      return src;
    };

    // --- piston voice ---
    this.engGain = ctx.createGain(); this.engGain.gain.value = 0;
    this.engFilter = ctx.createBiquadFilter();
    this.engFilter.type = 'lowpass'; this.engFilter.frequency.value = 400; this.engFilter.Q.value = 2.5;
    this.engFilter.connect(this.engGain); this.engGain.connect(this.master);
    this.osc1 = ctx.createOscillator(); this.osc1.type = 'sawtooth';
    this.osc2 = ctx.createOscillator(); this.osc2.type = 'square';
    this.osc3 = ctx.createOscillator(); this.osc3.type = 'sawtooth'; this.osc3.detune.value = 9;
    const g1 = ctx.createGain(); g1.gain.value = 0.5;
    const g2 = ctx.createGain(); g2.gain.value = 0.25;
    const g3 = ctx.createGain(); g3.gain.value = 0.4;
    this.osc1.connect(g1); this.osc2.connect(g2); this.osc3.connect(g3);
    g1.connect(this.engFilter); g2.connect(this.engFilter); g3.connect(this.engFilter);
    this.osc1.start(); this.osc2.start(); this.osc3.start();
    // exhaust rasp
    this.exhFilter = ctx.createBiquadFilter();
    this.exhFilter.type = 'bandpass'; this.exhFilter.frequency.value = 300; this.exhFilter.Q.value = 1.4;
    this.exhGain = ctx.createGain(); this.exhGain.gain.value = 0;
    noise(this.exhFilter);
    this.exhFilter.connect(this.exhGain); this.exhGain.connect(this.master);

    // --- jet voice ---
    this.jetRumbleF = ctx.createBiquadFilter();
    this.jetRumbleF.type = 'lowpass'; this.jetRumbleF.frequency.value = 300;
    this.jetRumbleG = ctx.createGain(); this.jetRumbleG.gain.value = 0;
    noise(this.jetRumbleF);
    this.jetRumbleF.connect(this.jetRumbleG); this.jetRumbleG.connect(this.master);
    this.jetWhineF = ctx.createBiquadFilter();
    this.jetWhineF.type = 'bandpass'; this.jetWhineF.frequency.value = 3000; this.jetWhineF.Q.value = 9;
    this.jetWhineG = ctx.createGain(); this.jetWhineG.gain.value = 0;
    noise(this.jetWhineF);
    this.jetWhineF.connect(this.jetWhineG); this.jetWhineG.connect(this.master);
    this.abG = ctx.createGain(); this.abG.gain.value = 0;
    const abF = ctx.createBiquadFilter();
    abF.type = 'lowpass'; abF.frequency.value = 140; abF.Q.value = 1.5;
    noise(abF);
    abF.connect(this.abG); this.abG.connect(this.master);

    // --- wind ---
    this.windF = ctx.createBiquadFilter();
    this.windF.type = 'bandpass'; this.windF.frequency.value = 500; this.windF.Q.value = 0.45;
    this.windG = ctx.createGain(); this.windG.gain.value = 0;
    noise(this.windF);
    this.windF.connect(this.windG); this.windG.connect(this.master);

    // --- tyre rumble ---
    this.rollF = ctx.createBiquadFilter();
    this.rollF.type = 'lowpass'; this.rollF.frequency.value = 150;
    this.rollG = ctx.createGain(); this.rollG.gain.value = 0;
    noise(this.rollF);
    this.rollF.connect(this.rollG); this.rollG.connect(this.master);

    // --- stall horn ---
    this.horn = ctx.createOscillator();
    this.horn.type = 'square'; this.horn.frequency.value = 470;
    this.hornG = ctx.createGain(); this.hornG.gain.value = 0;
    this.horn.connect(this.hornG); this.hornG.connect(this.master);
    this.horn.start();

    this.ready = true;
    // fade master in
    this.master.gain.setTargetAtTime(0.62, ctx.currentTime, 0.4);
  }

  attach(af) {
    this.engineType = af.engine.type;
    this.pulsesPerRev = af.id === 'p51' ? 3 : 2;
  }

  set(param, v, tc = 0.06) {
    param.setTargetAtTime(v, this.ctx.currentTime, tc);
  }

  update(dt, fm, camDist, camMode) {
    if (!this.ready || !fm) return;
    const out = fm.out;
    const cockpit = camMode === 1;
    const ext = clamp(1 / (1 + camDist / 110), 0.12, 1); // distance attenuation
    const att = cockpit ? 0.85 : ext;

    if (this.engineType === 'piston') {
      const f = Math.max((out.rpm / 60) * this.pulsesPerRev, 12);
      this.osc1.frequency.value = f;
      this.osc2.frequency.value = f * 0.5;
      this.osc3.frequency.value = f * 1.0;
      this.set(this.engFilter.frequency, 240 + 1500 * out.powerFrac + f * 2);
      const v = (0.035 + 0.30 * out.powerFrac) * att;
      this.set(this.engGain.gain, v);
      this.set(this.exhFilter.frequency, f * 2.6 + 80);
      this.set(this.exhGain.gain, (0.02 + 0.16 * out.powerFrac) * att);
      this.set(this.jetRumbleG.gain, 0);
      this.set(this.jetWhineG.gain, 0);
      this.set(this.abG.gain, 0);
    } else {
      const spool = clamp(out.powerFrac / 1.65, 0, 1);
      this.set(this.jetRumbleF.frequency, 220 + 900 * spool);
      this.set(this.jetRumbleG.gain, (0.05 + 0.5 * spool) * att);
      this.set(this.jetWhineF.frequency, 2200 + 4200 * spool);
      this.set(this.jetWhineG.gain, (0.012 + 0.05 * spool) * (cockpit ? 0.5 : ext));
      const ab = fm.inputs.afterburner && out.powerFrac > 1.02 ? 0.5 : 0;
      this.set(this.abG.gain, ab * att, 0.12);
      this.set(this.engGain.gain, 0);
      this.set(this.exhGain.gain, 0);
    }

    // wind
    const q = 0.5 * 1.225 * out.tas * out.tas;
    let wind = clamp(q / 5200, 0, 1.15) * (cockpit ? 0.32 : 0.45);
    if (fm.inputs.gearDown && fm.af.gear.retractable && out.tas > 60) wind *= 1.35;
    if (out.stalled) wind *= 1.5;
    this.set(this.windF.frequency, 300 + out.tas * 7);
    this.set(this.windG.gain, wind);

    // tyre rumble
    const roll = out.onGround ? clamp(out.wheelSpeed / 45, 0, 1) * (out.onRunway ? 0.30 : 0.55) : 0;
    this.set(this.rollG.gain, roll * att);
    this.set(this.rollF.frequency, 90 + out.wheelSpeed * 3);

    // stall horn (piston: steady horn; jet: pulsing tone)
    let horn = 0;
    if (!out.onGround && out.aoaFrac > 0.80 && out.tas > 18) {
      horn = clamp((out.aoaFrac - 0.80) / 0.15, 0, 1) * 0.16;
      if (this.engineType === 'jet') {
        horn *= Math.sin(this.ctx.currentTime * 22) > 0 ? 1 : 0;
        this.horn.frequency.value = 880;
      } else {
        this.horn.frequency.value = 440 + 80 * out.aoaFrac;
      }
    }
    this.set(this.hornG.gain, horn, 0.02);
  }

  oneShot(buildFn) {
    if (!this.ready) return;
    buildFn(this.ctx, this.master);
  }

  thump(intensity = 1) {
    this.oneShot((ctx, master) => {
      const t = ctx.currentTime;
      const src = ctx.createBufferSource();
      src.buffer = this.noiseBuf;
      const f = ctx.createBiquadFilter();
      f.type = 'lowpass'; f.frequency.value = 260;
      const g = ctx.createGain();
      g.gain.setValueAtTime(clamp(0.25 * intensity, 0, 0.8), t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
      src.connect(f); f.connect(g); g.connect(master);
      src.start(t); src.stop(t + 0.3);
      const o = ctx.createOscillator();
      o.frequency.setValueAtTime(85, t);
      o.frequency.exponentialRampToValueAtTime(40, t + 0.18);
      const og = ctx.createGain();
      og.gain.setValueAtTime(clamp(0.3 * intensity, 0, 0.7), t);
      og.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
      o.connect(og); og.connect(master);
      o.start(t); o.stop(t + 0.25);
    });
  }

  screech() {
    this.oneShot((ctx, master) => {
      const t = ctx.currentTime;
      const src = ctx.createBufferSource();
      src.buffer = this.noiseBuf;
      const f = ctx.createBiquadFilter();
      f.type = 'bandpass'; f.Q.value = 14;
      f.frequency.setValueAtTime(1900, t);
      f.frequency.exponentialRampToValueAtTime(900, t + 0.5);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.10, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
      src.connect(f); f.connect(g); g.connect(master);
      src.start(t); src.stop(t + 0.55);
    });
  }

  explosion() {
    this.oneShot((ctx, master) => {
      const t = ctx.currentTime;
      const src = ctx.createBufferSource();
      src.buffer = this.noiseBuf;
      const f = ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.setValueAtTime(900, t);
      f.frequency.exponentialRampToValueAtTime(90, t + 1.6);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.9, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 1.8);
      src.connect(f); f.connect(g); g.connect(master);
      src.start(t); src.stop(t + 1.9);
      const o = ctx.createOscillator();
      o.frequency.setValueAtTime(60, t);
      o.frequency.exponentialRampToValueAtTime(28, t + 1.2);
      const og = ctx.createGain();
      og.gain.setValueAtTime(0.55, t);
      og.gain.exponentialRampToValueAtTime(0.001, t + 1.3);
      o.connect(og); og.connect(master);
      o.start(t); o.stop(t + 1.4);
    });
  }

  silenceEngine() {
    if (!this.ready) return;
    this.set(this.engGain.gain, 0, 0.2);
    this.set(this.exhGain.gain, 0, 0.2);
    this.set(this.jetRumbleG.gain, 0, 0.2);
    this.set(this.jetWhineG.gain, 0, 0.2);
    this.set(this.abG.gain, 0, 0.1);
    this.set(this.hornG.gain, 0, 0.05);
    this.set(this.rollG.gain, 0, 0.1);
  }
}
