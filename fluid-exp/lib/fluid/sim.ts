/**
 * 2D particle fluid using double density relaxation from
 * Clavet, Beaudoin, Poulin — "Particle-based Viscoelastic Fluid Simulation"
 * (SCA 2005). Positions are in CSS pixels, time in seconds.
 */

export const MAX_PARTICLES = 6000;

// Interaction radius. Everything else is tuned relative to this.
const H = 26;
const H2 = H * H;
const INV_H = 1 / H;

const SUBSTEPS = 2;
const DT = 1 / (60 * SUBSTEPS);
const DT2 = DT * DT;
const INV_DT = 1 / DT;

const GRAVITY = 2400; // px/s^2
const REST_DENSITY = 5.0;
const STIFFNESS = 650;
const NEAR_STIFFNESS = 4500;
const VISC_LINEAR = 8; // sigma
const VISC_QUAD = 0.04; // beta
const MAX_SPEED = 1500; // px/s — also prevents tunneling: MAX_SPEED * DT < H/2
const MAX_SPEED2 = MAX_SPEED * MAX_SPEED;
const MAX_PUSH = H * 0.35; // per-pair relaxation displacement clamp
const WALL = 6; // container wall margin in px
const EVAPORATE = 2.4; // life decay per second once a particle is recycled

const MAX_NEIGHBORS = 80;

export class FluidSim {
  count = 0;
  width = 1;
  height = 1;

  readonly x = new Float32Array(MAX_PARTICLES);
  readonly y = new Float32Array(MAX_PARTICLES);
  readonly vx = new Float32Array(MAX_PARTICLES);
  readonly vy = new Float32Array(MAX_PARTICLES);
  readonly colR = new Float32Array(MAX_PARTICLES);
  readonly colG = new Float32Array(MAX_PARTICLES);
  readonly colB = new Float32Array(MAX_PARTICLES);
  readonly life = new Float32Array(MAX_PARTICLES);

  private readonly prevX = new Float32Array(MAX_PARTICLES);
  private readonly prevY = new Float32Array(MAX_PARTICLES);
  private readonly dying = new Uint8Array(MAX_PARTICLES);
  private readonly seq = new Float64Array(MAX_PARTICLES);
  private spawnSeq = 0;

  // Uniform grid for neighbor search, rebuilt by counting sort.
  private gw = 1;
  private gh = 1;
  private cellStart = new Int32Array(2);
  private cellCursor = new Int32Array(1);
  private readonly cellOf = new Int32Array(MAX_PARTICLES);
  private readonly entries = new Int32Array(MAX_PARTICLES);

  // Per-particle neighbor scratch (filled during relaxation).
  private readonly nbIdx = new Int32Array(MAX_NEIGHBORS);
  private readonly nbUx = new Float32Array(MAX_NEIGHBORS);
  private readonly nbUy = new Float32Array(MAX_NEIGHBORS);
  private readonly nbW = new Float32Array(MAX_NEIGHBORS);

  resize(w: number, h: number) {
    this.width = Math.max(64, w);
    this.height = Math.max(64, h);
    this.gw = Math.max(1, Math.ceil(this.width / H));
    this.gh = Math.max(1, Math.ceil(this.height / H));
    const nc = this.gw * this.gh;
    if (this.cellStart.length < nc + 1) {
      this.cellStart = new Int32Array(nc + 1);
      this.cellCursor = new Int32Array(nc);
    }
  }

  spawn(px: number, py: number, velX: number, velY: number, r: number, g: number, b: number): boolean {
    if (this.count >= MAX_PARTICLES) {
      // Recycle: let the oldest fluid evaporate to make room.
      this.evaporateOldest(2);
      return false;
    }
    const m = WALL + 1;
    const i = this.count++;
    this.x[i] = px < m ? m : px > this.width - m ? this.width - m : px;
    this.y[i] = py < m ? m : py > this.height - m ? this.height - m : py;
    this.prevX[i] = this.x[i];
    this.prevY[i] = this.y[i];
    this.vx[i] = velX;
    this.vy[i] = velY;
    this.colR[i] = r;
    this.colG[i] = g;
    this.colB[i] = b;
    this.life[i] = 1;
    this.dying[i] = 0;
    this.seq[i] = this.spawnSeq++;
    return true;
  }

  step() {
    for (let s = 0; s < SUBSTEPS; s++) this.substep();
    this.removeDead();
  }

  private substep() {
    const { count, x, y, vx, vy, prevX, prevY } = this;

    for (let i = 0; i < count; i++) {
      vy[i] += GRAVITY * DT;
      const s2 = vx[i] * vx[i] + vy[i] * vy[i];
      if (s2 > MAX_SPEED2) {
        const s = MAX_SPEED / Math.sqrt(s2);
        vx[i] *= s;
        vy[i] *= s;
      }
      if (this.dying[i]) this.life[i] -= EVAPORATE * DT;
    }

    this.buildGrid();
    this.applyViscosity();

    for (let i = 0; i < count; i++) {
      prevX[i] = x[i];
      prevY[i] = y[i];
      x[i] += vx[i] * DT;
      y[i] += vy[i] * DT;
    }

    this.buildGrid();
    this.relax();

    // Container walls, then derive velocity from the position change.
    const xMax = this.width - WALL;
    const yMax = this.height - WALL;
    for (let i = 0; i < count; i++) {
      if (x[i] < WALL) x[i] = WALL;
      else if (x[i] > xMax) x[i] = xMax;
      if (y[i] < WALL) y[i] = WALL;
      else if (y[i] > yMax) y[i] = yMax;
      vx[i] = (x[i] - prevX[i]) * INV_DT;
      vy[i] = (y[i] - prevY[i]) * INV_DT;
    }
  }

  private buildGrid() {
    const { gw, gh, count, cellStart, cellOf, entries } = this;
    const nc = gw * gh;
    cellStart.fill(0, 0, nc + 1);
    for (let i = 0; i < count; i++) {
      let cx = (this.x[i] * INV_H) | 0;
      let cy = (this.y[i] * INV_H) | 0;
      if (cx < 0) cx = 0;
      else if (cx >= gw) cx = gw - 1;
      if (cy < 0) cy = 0;
      else if (cy >= gh) cy = gh - 1;
      const c = cy * gw + cx;
      cellOf[i] = c;
      cellStart[c + 1]++;
    }
    for (let c = 0; c < nc; c++) cellStart[c + 1] += cellStart[c];
    const cur = this.cellCursor;
    cur.set(cellStart.subarray(0, nc));
    for (let i = 0; i < count; i++) entries[cur[cellOf[i]]++] = i;
  }

  /** Pairwise viscosity impulses (paper section 5.3). Each pair handled once. */
  private applyViscosity() {
    const { count, x, y, vx, vy, gw, gh, cellStart, entries, cellOf } = this;
    for (let i = 0; i < count; i++) {
      const xi = x[i];
      const yi = y[i];
      const c0 = cellOf[i];
      const cx = c0 % gw;
      const cy = (c0 / gw) | 0;
      const gx0 = cx > 0 ? cx - 1 : 0;
      const gx1 = cx < gw - 1 ? cx + 1 : cx;
      const gy0 = cy > 0 ? cy - 1 : 0;
      const gy1 = cy < gh - 1 ? cy + 1 : cy;
      for (let gy = gy0; gy <= gy1; gy++) {
        for (let gx = gx0; gx <= gx1; gx++) {
          const c = gy * gw + gx;
          const end = cellStart[c + 1];
          for (let k = cellStart[c]; k < end; k++) {
            const j = entries[k];
            if (j <= i) continue;
            const dx = x[j] - xi;
            const dy = y[j] - yi;
            const r2 = dx * dx + dy * dy;
            if (r2 >= H2 || r2 < 1e-8) continue;
            const r = Math.sqrt(r2);
            const ux = dx / r;
            const uy = dy / r;
            const u = (vx[i] - vx[j]) * ux + (vy[i] - vy[j]) * uy;
            if (u <= 0) continue;
            let im = DT * (1 - r * INV_H) * (VISC_LINEAR * u + VISC_QUAD * u * u);
            if (im > u) im = u; // never reverse relative motion
            const hx = 0.5 * im * ux;
            const hy = 0.5 * im * uy;
            vx[i] -= hx;
            vy[i] -= hy;
            vx[j] += hx;
            vy[j] += hy;
          }
        }
      }
    }
  }

  /** Double density relaxation (paper algorithm 2), Gauss-Seidel style. */
  private relax() {
    const { count, x, y, gw, gh, cellStart, entries, cellOf, nbIdx, nbUx, nbUy, nbW } = this;
    for (let i = 0; i < count; i++) {
      const xi = x[i];
      const yi = y[i];
      const c0 = cellOf[i];
      const cx = c0 % gw;
      const cy = (c0 / gw) | 0;
      const gx0 = cx > 0 ? cx - 1 : 0;
      const gx1 = cx < gw - 1 ? cx + 1 : cx;
      const gy0 = cy > 0 ? cy - 1 : 0;
      const gy1 = cy < gh - 1 ? cy + 1 : cy;

      let dens = 0;
      let densNear = 0;
      let nn = 0;
      for (let gy = gy0; gy <= gy1; gy++) {
        for (let gx = gx0; gx <= gx1; gx++) {
          const c = gy * gw + gx;
          const end = cellStart[c + 1];
          for (let k = cellStart[c]; k < end; k++) {
            const j = entries[k];
            if (j === i) continue;
            const dx = x[j] - xi;
            const dy = y[j] - yi;
            const r2 = dx * dx + dy * dy;
            if (r2 >= H2) continue;
            let ux: number;
            let uy: number;
            let w: number;
            if (r2 < 1e-8) {
              // Coincident particles: deterministic pseudo-random separation.
              ux = j & 1 ? 0.7071 : -0.7071;
              uy = j & 2 ? 0.7071 : -0.7071;
              w = 1;
            } else {
              const r = Math.sqrt(r2);
              ux = dx / r;
              uy = dy / r;
              w = 1 - r * INV_H;
            }
            dens += w * w;
            densNear += w * w * w;
            if (nn < MAX_NEIGHBORS) {
              nbIdx[nn] = j;
              nbUx[nn] = ux;
              nbUy[nn] = uy;
              nbW[nn] = w;
              nn++;
            }
          }
        }
      }

      const press = STIFFNESS * (dens - REST_DENSITY);
      const pressNear = NEAR_STIFFNESS * densNear;
      let dxi = 0;
      let dyi = 0;
      for (let k = 0; k < nn; k++) {
        const w = nbW[k];
        let d = DT2 * (press * w + pressNear * w * w);
        if (d > MAX_PUSH) d = MAX_PUSH;
        else if (d < -MAX_PUSH) d = -MAX_PUSH;
        const hx = 0.5 * d * nbUx[k];
        const hy = 0.5 * d * nbUy[k];
        const j = nbIdx[k];
        x[j] += hx;
        y[j] += hy;
        dxi -= hx;
        dyi -= hy;
      }
      x[i] += dxi;
      y[i] += dyi;
    }
  }

  private evaporateOldest(k: number) {
    for (let n = 0; n < k; n++) {
      let best = -1;
      let bestSeq = Infinity;
      for (let i = 0; i < this.count; i++) {
        if (!this.dying[i] && this.seq[i] < bestSeq) {
          bestSeq = this.seq[i];
          best = i;
        }
      }
      if (best < 0) return;
      this.dying[best] = 1;
    }
  }

  private removeDead() {
    for (let i = 0; i < this.count; i++) {
      if (this.life[i] > 0) continue;
      const l = --this.count;
      if (i !== l) {
        this.x[i] = this.x[l];
        this.y[i] = this.y[l];
        this.prevX[i] = this.prevX[l];
        this.prevY[i] = this.prevY[l];
        this.vx[i] = this.vx[l];
        this.vy[i] = this.vy[l];
        this.colR[i] = this.colR[l];
        this.colG[i] = this.colG[l];
        this.colB[i] = this.colB[l];
        this.life[i] = this.life[l];
        this.dying[i] = this.dying[l];
        this.seq[i] = this.seq[l];
      }
      i--;
    }
  }
}
