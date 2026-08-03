// Minimal allocation-conscious vec3/quaternion math.
// Vectors are [x,y,z], quaternions are [x,y,z,w] (body -> world).
// All functions accept an `out` array and return it.

export const TAU = Math.PI * 2;
export const DEG = Math.PI / 180;
export const RAD2DEG = 180 / Math.PI;

export function v3(x = 0, y = 0, z = 0) { return [x, y, z]; }

export function vset(out, x, y, z) { out[0] = x; out[1] = y; out[2] = z; return out; }
export function vcopy(out, a) { out[0] = a[0]; out[1] = a[1]; out[2] = a[2]; return out; }
export function vadd(out, a, b) { out[0] = a[0] + b[0]; out[1] = a[1] + b[1]; out[2] = a[2] + b[2]; return out; }
export function vsub(out, a, b) { out[0] = a[0] - b[0]; out[1] = a[1] - b[1]; out[2] = a[2] - b[2]; return out; }
export function vscale(out, a, s) { out[0] = a[0] * s; out[1] = a[1] * s; out[2] = a[2] * s; return out; }
export function vaddScaled(out, a, b, s) { out[0] = a[0] + b[0] * s; out[1] = a[1] + b[1] * s; out[2] = a[2] + b[2] * s; return out; }
export function vdot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
export function vcross(out, a, b) {
  const ax = a[0], ay = a[1], az = a[2], bx = b[0], by = b[1], bz = b[2];
  out[0] = ay * bz - az * by;
  out[1] = az * bx - ax * bz;
  out[2] = ax * by - ay * bx;
  return out;
}
export function vlen(a) { return Math.hypot(a[0], a[1], a[2]); }
export function vlenSq(a) { return a[0] * a[0] + a[1] * a[1] + a[2] * a[2]; }
export function vnormalize(out, a) {
  const l = vlen(a);
  if (l < 1e-12) { out[0] = 0; out[1] = 0; out[2] = 0; return out; }
  return vscale(out, a, 1 / l);
}
export function vzero(out) { out[0] = 0; out[1] = 0; out[2] = 0; return out; }

export function quat(x = 0, y = 0, z = 0, w = 1) { return [x, y, z, w]; }
export function qcopy(out, a) { out[0] = a[0]; out[1] = a[1]; out[2] = a[2]; out[3] = a[3]; return out; }
export function qidentity(out) { out[0] = 0; out[1] = 0; out[2] = 0; out[3] = 1; return out; }

export function qmul(out, a, b) {
  const ax = a[0], ay = a[1], az = a[2], aw = a[3];
  const bx = b[0], by = b[1], bz = b[2], bw = b[3];
  out[0] = aw * bx + ax * bw + ay * bz - az * by;
  out[1] = aw * by - ax * bz + ay * bw + az * bx;
  out[2] = aw * bz + ax * by - ay * bx + az * bw;
  out[3] = aw * bw - ax * bx - ay * by - az * bz;
  return out;
}

export function qnormalize(out, a) {
  const l = Math.hypot(a[0], a[1], a[2], a[3]);
  const s = l > 1e-12 ? 1 / l : 0;
  out[0] = a[0] * s; out[1] = a[1] * s; out[2] = a[2] * s; out[3] = a[3] * s;
  return out;
}

export function qfromAxisAngle(out, axis, angle) {
  const h = angle * 0.5, s = Math.sin(h);
  out[0] = axis[0] * s; out[1] = axis[1] * s; out[2] = axis[2] * s; out[3] = Math.cos(h);
  return out;
}

// Rotate vector v by quaternion q:  v' = v + 2*qw*(qv x v) + 2*(qv x (qv x v))
export function qrotate(out, q, v) {
  const qx = q[0], qy = q[1], qz = q[2], qw = q[3];
  const vx = v[0], vy = v[1], vz = v[2];
  const tx = 2 * (qy * vz - qz * vy);
  const ty = 2 * (qz * vx - qx * vz);
  const tz = 2 * (qx * vy - qy * vx);
  out[0] = vx + qw * tx + qy * tz - qz * ty;
  out[1] = vy + qw * ty + qz * tx - qx * tz;
  out[2] = vz + qw * tz + qx * ty - qy * tx;
  return out;
}

// Rotate by the conjugate (world -> body).
export function qrotateInv(out, q, v) {
  const qx = -q[0], qy = -q[1], qz = -q[2], qw = q[3];
  const vx = v[0], vy = v[1], vz = v[2];
  const tx = 2 * (qy * vz - qz * vy);
  const ty = 2 * (qz * vx - qx * vz);
  const tz = 2 * (qx * vy - qy * vx);
  out[0] = vx + qw * tx + qy * tz - qz * ty;
  out[1] = vy + qw * ty + qz * tx - qx * tz;
  out[2] = vz + qw * tz + qx * ty - qy * tx;
  return out;
}

// Integrate orientation: q += 0.5 * q ⊗ (omega_body, 0) * dt, then renormalize.
export function qintegrate(out, q, omegaBody, dt) {
  const ox = omegaBody[0] * dt * 0.5, oy = omegaBody[1] * dt * 0.5, oz = omegaBody[2] * dt * 0.5;
  const qx = q[0], qy = q[1], qz = q[2], qw = q[3];
  out[0] = qx + (qw * ox + qy * oz - qz * oy);
  out[1] = qy + (qw * oy - qx * oz + qz * ox);
  out[2] = qz + (qw * oz + qx * oy - qy * ox);
  out[3] = qw + (-qx * ox - qy * oy - qz * oz);
  return qnormalize(out, out);
}

export function clamp(x, lo, hi) { return x < lo ? lo : (x > hi ? hi : x); }
export function lerp(a, b, t) { return a + (b - a) * t; }

// Gaussian random (Box-Muller, cached spare).
let spare = null;
export function randn() {
  if (spare !== null) { const s = spare; spare = null; return s; }
  let u, v, s;
  do {
    u = Math.random() * 2 - 1;
    v = Math.random() * 2 - 1;
    s = u * u + v * v;
  } while (s >= 1 || s === 0);
  const m = Math.sqrt(-2 * Math.log(s) / s);
  spare = v * m;
  return u * m;
}

// First-order low-pass filter (PT1).
export class PT1 {
  constructor(cutoffHz, dt) { this.k = pt1Gain(cutoffHz, dt); this.y = 0; }
  set(v) { this.y = v; return v; }
  update(x) { this.y += this.k * (x - this.y); return this.y; }
}
export function pt1Gain(cutoffHz, dt) {
  const rc = 1 / (TAU * cutoffHz);
  return dt / (rc + dt);
}

// Second-order low-pass (two cascaded PT1, like Betaflight's PT2).
export class PT2 {
  constructor(cutoffHz, dt) {
    // Cascade correction so -3dB lands at cutoffHz.
    const adj = cutoffHz * 1.554;
    this.a = new PT1(adj, dt);
    this.b = new PT1(adj, dt);
  }
  set(v) { this.a.set(v); this.b.set(v); return v; }
  update(x) { return this.b.update(this.a.update(x)); }
}

// Ornstein-Uhlenbeck noise process: band-limited noise with std `sigma`
// and correlation time `tau`. Used for gusts and propwash turbulence.
export class OUNoise {
  constructor(tau, sigma) { this.tau = tau; this.sigma = sigma; this.x = 0; }
  update(dt) {
    const a = clamp(dt / this.tau, 0, 1);
    this.x += -a * this.x + this.sigma * Math.sqrt(2 * a) * randn();
    return this.x;
  }
}
