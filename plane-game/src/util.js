// Math helpers, unit conversions, deterministic noise.

export const DEG2RAD = Math.PI / 180;
export const RAD2DEG = 180 / Math.PI;
export const MS2KT = 1.943844;   // m/s -> knots
export const M2FT = 3.280840;    // meters -> feet
export const MS2FPM = 196.8504;  // m/s -> feet per minute

export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
export const lerp = (a, b, t) => a + (b - a) * t;
export const smoothstep = (a, b, x) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
// Frame-rate independent exponential approach: returns value moved toward target.
export const damp = (current, target, rate, dt) =>
  lerp(current, target, 1 - Math.exp(-rate * dt));

export const sat = (x) => clamp(x, -1, 1);

// Smooth saturation (tanh-like) — keeps friction forces from chattering.
export const softSat = (x) => Math.tanh(x);

export function wrapPi(a) {
  while (a > Math.PI) a -= 2 * Math.PI;
  while (a < -Math.PI) a += 2 * Math.PI;
  return a;
}

export function wrap360(deg) {
  let d = deg % 360;
  if (d < 0) d += 360;
  return d;
}

// ---------------------------------------------------------------------------
// Deterministic 2D value noise + fBm (used by terrain, must be identical for
// physics collision and visual mesh).
// ---------------------------------------------------------------------------
function hash2(ix, iz) {
  let h = ix * 374761393 + iz * 668265263;
  h = (h ^ (h >> 13)) >>> 0;
  h = Math.imul(h, 1274126177) >>> 0;
  h = (h ^ (h >> 16)) >>> 0;
  return h / 4294967295;
}

const quintic = (t) => t * t * t * (t * (t * 6 - 15) + 10);

export function valueNoise2(x, z) {
  const ix = Math.floor(x), iz = Math.floor(z);
  const fx = x - ix, fz = z - iz;
  const u = quintic(fx), v = quintic(fz);
  const a = hash2(ix, iz), b = hash2(ix + 1, iz);
  const c = hash2(ix, iz + 1), d = hash2(ix + 1, iz + 1);
  return lerp(lerp(a, b, u), lerp(c, d, u), v); // 0..1
}

export function fbm2(x, z, octaves = 4, lacunarity = 2.0, gain = 0.5) {
  let amp = 0.5, freq = 1.0, sum = 0, norm = 0;
  for (let i = 0; i < octaves; i++) {
    sum += amp * valueNoise2(x * freq, z * freq);
    norm += amp;
    amp *= gain;
    freq *= lacunarity;
  }
  return sum / norm; // 0..1
}

// Ridged noise for mountains.
export function ridge2(x, z, octaves = 4) {
  let amp = 0.5, freq = 1.0, sum = 0, norm = 0;
  for (let i = 0; i < octaves; i++) {
    const n = 1 - Math.abs(2 * valueNoise2(x * freq, z * freq) - 1);
    sum += amp * n * n;
    norm += amp;
    amp *= 0.5;
    freq *= 2.13;
  }
  return sum / norm; // 0..1
}

// Mulberry32 seeded PRNG for scattering scenery deterministically.
export function mulberry32(seed) {
  let s = seed >>> 0;
  return function () {
    s |= 0; s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function fmtTime(sec) {
  const m = Math.floor(sec / 60), s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}
