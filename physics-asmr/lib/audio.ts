/**
 * Soft chime/thump synthesis for collision sounds, via the Web Audio API.
 *
 * - Ball–ball impacts ring a note from a C-major pentatonic scale (any
 *   combination of notes is consonant — nothing ever clashes).
 *   Pitch is mapped from marble size: big marble → low note, exactly like a
 *   real chime bar. Loudness follows impact speed; position sets stereo pan.
 * - Wall impacts make a muted wooden thump (pitch-dropping sine + a breath
 *   of band-passed noise).
 * - Everything runs through a generated hall reverb and a gentle compressor.
 * - A per-marble cooldown and a global voice cap keep dense moments from
 *   turning into noise — it stays sparse and ASMR-calm.
 */

const PENTATONIC = [
  261.63, // C4
  293.66, // D4
  329.63, // E4
  392.0, //  G4
  440.0, //  A4
  523.25, // C5
  587.33, // D5
  659.26, // E5
  783.99, // G5
  880.0, //  A5
];

const MAX_VOICES_WINDOW = 0.13; // s
const MAX_VOICES = 9;
const PER_BALL_COOLDOWN = 0.07; // s

export class ChimeAudio {
  private ctx: AudioContext | null = null;
  private bus: DynamicsCompressorNode | null = null;
  private wetSend: GainNode | null = null;
  private master: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private recent: number[] = [];
  private lastHit = new Map<number, number>();
  muted = false;

  /** Must be called from a user gesture (browser autoplay policy). */
  async init(): Promise<void> {
    if (this.ctx) {
      if (this.ctx.state === "suspended") await this.ctx.resume();
      return;
    }
    type AudioCtor = typeof AudioContext;
    const Ctor: AudioCtor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext: AudioCtor })
        .webkitAudioContext;
    const ctx = new Ctor();

    const master = ctx.createGain();
    master.gain.value = this.muted ? 0 : 0.8;
    master.connect(ctx.destination);

    const bus = ctx.createDynamicsCompressor();
    bus.threshold.value = -20;
    bus.knee.value = 18;
    bus.ratio.value = 5;
    bus.attack.value = 0.004;
    bus.release.value = 0.22;
    bus.connect(master);

    // Hall reverb: stereo exponentially-decaying noise impulse response.
    const convolver = ctx.createConvolver();
    convolver.buffer = this.makeImpulseResponse(ctx, 2.8, 3.2);
    const wetSend = ctx.createGain();
    wetSend.gain.value = 0.4;
    wetSend.connect(convolver);
    convolver.connect(bus);

    // 1 s of white noise, reused by every thump.
    const noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const nd = noise.getChannelData(0);
    for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;

    this.ctx = ctx;
    this.bus = bus;
    this.wetSend = wetSend;
    this.master = master;
    this.noiseBuffer = noise;
    if (ctx.state === "suspended") await ctx.resume();
  }

  setMuted(m: boolean): void {
    this.muted = m;
    if (this.ctx && this.master) {
      this.master.gain.setTargetAtTime(
        m ? 0 : 0.8,
        this.ctx.currentTime,
        0.05,
      );
    }
  }

  /** sizeT: 0 = smallest marble … 1 = largest. vel: 0..1. pan: -1..1. */
  chime(sizeT: number, vel: number, pan: number, ballId: number): void {
    const ctx = this.ctx;
    if (!ctx || this.muted || vel <= 0) return;
    const t0 = ctx.currentTime;
    if (!this.allowVoice(ballId, t0)) return;

    // Big marble → low note, like a long chime bar.
    const idx = Math.round((1 - sizeT) * (PENTATONIC.length - 1));
    const f = PENTATONIC[Math.max(0, Math.min(PENTATONIC.length - 1, idx))];
    const peak = vel * 0.5;
    const decay = 1.1 + 260 / f; // low notes ring longer

    const out = this.voiceOutput(pan);

    // Two barely-detuned fundamentals — the slow beating is the shimmer.
    this.tone(f, peak, t0, decay, out);
    this.tone(f * 1.004, peak * 0.55, t0, decay * 0.9, out);
    // The bright ~4× partial that gives a struck-bar character.
    this.tone(f * 4.02, peak * 0.13, t0, 0.32, out);
  }

  /** Muted wooden thump for wall contact. */
  thump(sizeT: number, vel: number, pan: number, ballId: number): void {
    const ctx = this.ctx;
    if (!ctx || this.muted || vel <= 0 || !this.noiseBuffer) return;
    const t0 = ctx.currentTime;
    if (!this.allowVoice(-ballId - 1, t0)) return;

    const f = 75 + (1 - sizeT) * 85; // big marble → deeper knock
    const out = this.voiceOutput(pan);

    // Pitch-dropping sine body.
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(f * 1.5, t0);
    osc.frequency.exponentialRampToValueAtTime(f * 0.85, t0 + 0.09);
    const og = ctx.createGain();
    og.gain.setValueAtTime(0.0001, t0);
    og.gain.linearRampToValueAtTime(vel * 0.45, t0 + 0.004);
    og.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.22);
    osc.connect(og);
    og.connect(out);
    osc.start(t0);
    osc.stop(t0 + 0.3);

    // A breath of knock noise.
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = f * 5;
    bp.Q.value = 0.9;
    const ng = ctx.createGain();
    ng.gain.setValueAtTime(0.0001, t0);
    ng.gain.linearRampToValueAtTime(vel * 0.16, t0 + 0.003);
    ng.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.07);
    src.connect(bp);
    bp.connect(ng);
    ng.connect(out);
    src.start(t0, Math.random());
    src.stop(t0 + 0.12);

    osc.onended = () => out.disconnect();
  }

  async dispose(): Promise<void> {
    if (this.ctx) {
      await this.ctx.close().catch(() => {});
      this.ctx = null;
    }
  }

  private allowVoice(id: number, t: number): boolean {
    this.recent = this.recent.filter((r) => t - r < MAX_VOICES_WINDOW);
    if (this.recent.length >= MAX_VOICES) return false;
    const last = this.lastHit.get(id);
    if (last !== undefined && t - last < PER_BALL_COOLDOWN) return false;
    this.lastHit.set(id, t);
    this.recent.push(t);
    return true;
  }

  /** Panner feeding both the dry bus and the reverb send. */
  private voiceOutput(pan: number): StereoPannerNode {
    const ctx = this.ctx!;
    const p = ctx.createStereoPanner();
    p.pan.value = Math.max(-0.9, Math.min(0.9, pan));
    p.connect(this.bus!);
    p.connect(this.wetSend!);
    return p;
  }

  private tone(
    freq: number,
    peak: number,
    t0: number,
    decay: number,
    out: AudioNode,
  ): void {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(Math.max(peak, 0.0002), t0 + 0.003);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + decay);
    osc.connect(g);
    g.connect(out);
    osc.start(t0);
    osc.stop(t0 + decay + 0.05);
  }

  private makeImpulseResponse(
    ctx: AudioContext,
    seconds: number,
    decayPower: number,
  ): AudioBuffer {
    const rate = ctx.sampleRate;
    const len = Math.floor(rate * seconds);
    const buf = ctx.createBuffer(2, len, rate);
    for (let ch = 0; ch < 2; ch++) {
      const data = buf.getChannelData(ch);
      for (let i = 0; i < len; i++) {
        const t = i / len;
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, decayPower);
      }
    }
    return buf;
  }
}
