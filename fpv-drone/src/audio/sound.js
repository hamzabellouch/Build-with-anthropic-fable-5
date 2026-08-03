// Synthesized quad audio from physics state. Dominant tones are the blade-
// passing frequency (RPM/60 * blade count) per motor plus a shaft harmonic;
// broadband noise scales with aerodynamic power; wind noise with airspeed in
// FPV view. Throttle pitch is a real cue pilots use — this matters for
// training, not just immersion.

export class QuadSound {
  constructor(blades) {
    this.blades = blades;
    this.ctx = null;
    this.master = null;
    this.motors = [];
    this.enabled = true;
    this.volume = 0.5;
  }

  // Must be called from a user gesture.
  start() {
    if (this.ctx) return;
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.ctx = ctx;
    this.master = ctx.createGain();
    this.master.gain.value = 0;
    this.master.connect(ctx.destination);

    for (let i = 0; i < 4; i++) {
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = 80;
      const oscG = ctx.createGain(); oscG.gain.value = 0;
      const sub = ctx.createOscillator();
      sub.type = 'triangle';
      sub.frequency.value = 30;
      const subG = ctx.createGain(); subG.gain.value = 0;
      const filt = ctx.createBiquadFilter();
      filt.type = 'lowpass'; filt.frequency.value = 1200; filt.Q.value = 0.8;
      osc.connect(oscG).connect(filt);
      sub.connect(subG).connect(filt);
      filt.connect(this.master);
      osc.start(); sub.start();
      this.motors.push({ osc, oscG, sub, subG, filt });
    }

    // Broadband prop/air noise.
    const len = ctx.sampleRate * 2;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    let lp = 0;
    for (let i = 0; i < len; i++) {
      lp += 0.18 * ((Math.random() * 2 - 1) - lp);   // pinkish
      d[i] = lp * 2.4;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buf; noise.loop = true;
    this.noiseG = ctx.createGain(); this.noiseG.gain.value = 0;
    this.noiseFilt = ctx.createBiquadFilter();
    this.noiseFilt.type = 'bandpass'; this.noiseFilt.frequency.value = 900; this.noiseFilt.Q.value = 0.5;
    noise.connect(this.noiseFilt).connect(this.noiseG).connect(this.master);
    noise.start();

    // Wind rush (FPV speed cue).
    const wind = ctx.createBufferSource();
    wind.buffer = buf; wind.loop = true; wind.playbackRate.value = 0.5;
    this.windG = ctx.createGain(); this.windG.gain.value = 0;
    const windF = ctx.createBiquadFilter();
    windF.type = 'lowpass'; windF.frequency.value = 500;
    wind.connect(windF).connect(this.windG).connect(this.master);
    wind.start();
  }

  // motorStates: [{w, thrust}], speed m/s, dist: camera distance (m).
  update(motorStates, speed, dist, dt) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const att = 1 / (1 + dist * dist * 0.012);     // distance attenuation for LOS view
    const vol = (this.enabled ? this.volume : 0) * att;
    this.master.gain.setTargetAtTime(vol * 0.5, t, 0.05);

    let totalPow = 0;
    for (let i = 0; i < 4; i++) {
      const m = this.motors[i], s = motorStates[i];
      const rps = s.w / (2 * Math.PI);
      const bpf = Math.max(20, rps * this.blades);
      m.osc.frequency.setTargetAtTime(Math.min(bpf, 6000), t, 0.02);
      m.sub.frequency.setTargetAtTime(Math.max(15, Math.min(rps, 2000)), t, 0.02);
      const load = Math.min(s.w / 4200, 1);
      m.oscG.gain.setTargetAtTime(0.030 + 0.075 * load, t, 0.03);
      m.subG.gain.setTargetAtTime(0.05 * load, t, 0.03);
      m.filt.frequency.setTargetAtTime(500 + 2600 * load, t, 0.05);
      totalPow += s.w * s.torque;
    }
    const pw = Math.min(totalPow / 2200, 1);
    this.noiseG.gain.setTargetAtTime(0.012 + 0.10 * pw, t, 0.06);
    this.windG.gain.setTargetAtTime(Math.min(speed / 45, 1) ** 2 * 0.30, t, 0.1);
  }

  thud(strength) {
    if (!this.ctx) return;
    const ctx = this.ctx, t = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(110, t);
    osc.frequency.exponentialRampToValueAtTime(34, t + 0.12);
    const g = ctx.createGain();
    g.gain.setValueAtTime(Math.min(0.6, strength * 0.06) * this.volume, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
    osc.connect(g).connect(ctx.destination);
    osc.start(t); osc.stop(t + 0.2);
  }
}
