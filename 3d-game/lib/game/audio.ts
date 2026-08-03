// NEON VOID — WebAudio synth engine. Everything is generated, no audio assets.

class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private noiseBuf: AudioBuffer | null = null;
  private musicTimer: ReturnType<typeof setInterval> | null = null;
  private nextBeat = 0;
  private beatIdx = 0;
  muted = false;

  init() {
    if (this.ctx) {
      if (this.ctx.state === "suspended") this.ctx.resume();
      return;
    }
    try {
      this.ctx = new AudioContext();
    } catch {
      return;
    }
    this.master = this.ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 0.6;
    this.master.connect(this.ctx.destination);
    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = 0.5;
    this.musicGain.connect(this.master);

    // shared noise buffer
    const len = this.ctx.sampleRate * 1;
    this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = this.noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  }

  setMuted(m: boolean) {
    this.muted = m;
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(m ? 0 : 0.6, this.ctx.currentTime, 0.05);
    }
  }

  private tone(freq: number, endFreq: number, dur: number, type: OscillatorType, gain: number, when = 0) {
    if (!this.ctx || !this.master) return;
    const t = this.ctx.currentTime + when;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (endFreq !== freq) osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), t + dur);
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(g).connect(this.master);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  private noise(dur: number, gain: number, filterFreq: number, filterEnd: number, type: BiquadFilterType = "bandpass", when = 0) {
    if (!this.ctx || !this.master || !this.noiseBuf) return;
    const t = this.ctx.currentTime + when;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    src.loop = true;
    const f = this.ctx.createBiquadFilter();
    f.type = type;
    f.frequency.setValueAtTime(filterFreq, t);
    if (filterEnd !== filterFreq) f.frequency.exponentialRampToValueAtTime(Math.max(30, filterEnd), t + dur);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(f).connect(g).connect(this.master);
    src.start(t);
    src.stop(t + dur + 0.02);
  }

  shoot() { this.tone(820, 320, 0.09, "square", 0.05); }
  eshoot() { this.tone(220, 140, 0.18, "sawtooth", 0.05); }
  boom(mag = 0.5) {
    this.noise(0.35 + mag * 0.3, 0.25 + mag * 0.2, 1400, 90);
    this.tone(110, 38, 0.3 + mag * 0.25, "sine", 0.3);
  }
  phit() {
    this.tone(220, 55, 0.3, "sawtooth", 0.25);
    this.noise(0.2, 0.2, 800, 200);
  }
  deflect() { this.tone(1100, 1600, 0.1, "triangle", 0.12); }
  dash() { this.noise(0.22, 0.12, 2500, 600, "highpass"); }
  pickup() { this.tone(660, 660, 0.07, "sine", 0.1); this.tone(990, 990, 0.09, "sine", 0.1, 0.06); }
  power() {
    [440, 554, 659, 880].forEach((f, i) => this.tone(f, f, 0.12, "triangle", 0.12, i * 0.07));
  }
  levelup() {
    [523, 659, 784, 1046, 1318].forEach((f, i) => this.tone(f, f, 0.15, "square", 0.08, i * 0.08));
  }
  wave() {
    this.tone(110, 440, 0.5, "sawtooth", 0.12);
    this.tone(220, 220, 0.4, "triangle", 0.1, 0.15);
  }
  clear() { [784, 988, 1175].forEach((f, i) => this.tone(f, f, 0.2, "triangle", 0.1, i * 0.1)); }
  death() {
    this.noise(1.2, 0.4, 2000, 60);
    this.tone(220, 30, 1.4, "sawtooth", 0.3);
  }
  over() {
    [440, 349, 262, 196].forEach((f, i) => this.tone(f, f * 0.97, 0.4, "triangle", 0.14, i * 0.22));
  }

  // ---- music: dark pulsing synth loop ----
  startMusic() {
    if (!this.ctx || this.musicTimer) return;
    this.nextBeat = this.ctx.currentTime + 0.1;
    this.beatIdx = 0;
    this.musicTimer = setInterval(() => this.scheduleMusic(), 100);
  }

  stopMusic() {
    if (this.musicTimer) { clearInterval(this.musicTimer); this.musicTimer = null; }
  }

  private scheduleMusic() {
    if (!this.ctx || !this.musicGain) return;
    const eighth = 60 / 116 / 2; // 116 bpm, eighth notes
    // A minor-ish bass line, 16 steps
    const bass = [55, 0, 55, 0, 65.4, 0, 55, 0, 49, 0, 49, 0, 73.4, 0, 65.4, 0];
    const arp = [220, 261.6, 329.6, 261.6, 220, 261.6, 392, 329.6, 196, 246.9, 293.7, 246.9, 196, 246.9, 349.2, 293.7];
    while (this.nextBeat < this.ctx.currentTime + 0.35) {
      const i = this.beatIdx % 16;
      const t = this.nextBeat;
      const b = bass[i];
      if (b > 0) this.musicNote(b, t, eighth * 1.8, "sawtooth", 0.16, 240);
      if (i % 2 === 0) this.musicNote(arp[i], t, eighth * 0.9, "square", 0.025, 1800);
      if (i % 4 === 2) this.musicHat(t);
      this.beatIdx++;
      this.nextBeat += eighth;
    }
  }

  private musicNote(freq: number, t: number, dur: number, type: OscillatorType, gain: number, cutoff: number) {
    if (!this.ctx || !this.musicGain) return;
    const osc = this.ctx.createOscillator();
    osc.type = type;
    osc.frequency.value = freq;
    const f = this.ctx.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.value = cutoff;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(f).connect(g).connect(this.musicGain);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  private musicHat(t: number) {
    if (!this.ctx || !this.musicGain || !this.noiseBuf) return;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const f = this.ctx.createBiquadFilter();
    f.type = "highpass";
    f.frequency.value = 7000;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.03, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
    src.connect(f).connect(g).connect(this.musicGain);
    src.start(t);
    src.stop(t + 0.07);
  }

  handleEvent(type: string, mag?: number) {
    switch (type) {
      case "shoot": this.shoot(); break;
      case "eshoot": this.eshoot(); break;
      case "boom": this.boom(mag); break;
      case "phit": this.phit(); break;
      case "deflect": this.deflect(); break;
      case "dash": this.dash(); break;
      case "pickup": this.pickup(); break;
      case "power": this.power(); break;
      case "levelup": this.levelup(); break;
      case "wave": this.wave(); break;
      case "clear": this.clear(); break;
      case "death": this.death(); break;
      case "over": this.over(); break;
    }
  }
}

export const audio = new AudioEngine();
