/**
 * A small 2D rigid-body physics engine in SI units (metres, kilograms, seconds).
 *
 * Laws of physics modelled here:
 *  - Newton's 2nd law, integrated with semi-implicit (symplectic) Euler at a
 *    fixed timestep — stable and energy-faithful for orbital/bouncing motion.
 *  - Conservation of linear momentum: ball–ball contacts are resolved with an
 *    equal-and-opposite impulse along the contact normal (Newton's 3rd law),
 *    so Σ m·v is conserved exactly across every collision.
 *  - Newton's restitution model: relative normal speed after impact equals
 *    -e times the approach speed (e = coefficient of restitution). e < 1
 *    dissipates kinetic energy as a real inelastic collision does; e = 1 is
 *    perfectly elastic and conserves kinetic energy.
 *  - Coulomb friction at the container wall: |j_t| ≤ μ·|j_n|, clamped so
 *    friction can only remove relative sliding, never add energy.
 *  - The container is kinematic (motor-driven). A point on the wall moves at
 *    v = ω × r, which enters the relative-velocity term, so a spinning
 *    container does real mechanical work on the balls — exactly like a
 *    motorised drum in the lab.
 *
 * Idealisations (each one is itself physical): balls are smooth spheres
 * (frictionless ball–ball contact, no spin), and the chamber is evacuated
 * (no air drag).
 */

export interface Ball {
  id: number;
  x: number; // m
  y: number; // m  (y points down, matching the canvas; gravity is +y)
  vx: number; // m/s
  vy: number; // m/s
  r: number; // m
  m: number; // kg
  invM: number; // 1/kg
  colorIndex: number;
}

export interface ContactEvent {
  kind: "ball" | "wall";
  x: number; // contact point, m
  y: number;
  impact: number; // relative normal approach speed, m/s
  r: number; // radius of the (smaller) ball involved — used for pitch
  colorIndex: number;
  id: number; // id of the primary ball, for per-ball sound cooldowns
}

export interface WorldParams {
  gravity: number; // m/s²
  restitution: number; // 0..1, used for both ball–ball and ball–wall
  wallFriction: number; // Coulomb μ at the container surface
  spin: number; // container angular velocity, rad/s
  radius: number; // container circumradius, m
  sides: number; // container polygon sides
}

export const BALL_R_MIN = 0.085; // m
export const BALL_R_MAX = 0.21; // m
const GLASS_DENSITY = 2500; // kg/m³ (soda-lime glass)
const SLOP = 0.0005; // m of allowed penetration before positional correction
const CORRECTION = 0.8; // Baumgarte-style positional correction factor
const MAX_SPEED = 18; // m/s safety clamp against tunnelling
const MIN_EVENT_IMPACT = 0.1; // m/s — ignore resting-contact noise

interface Edge {
  ax: number; ay: number;
  bx: number; by: number;
  nx: number; ny: number; // unit inward normal
}

export class World {
  params: WorldParams;
  balls: Ball[] = [];
  angle = 0; // container rotation, rad
  private events: ContactEvent[] = [];
  private edges: Edge[] = [];
  private nextId = 1;

  constructor(params: WorldParams) {
    this.params = params;
  }

  /** Advance the simulation by dt seconds (call with a small fixed dt). */
  step(dt: number): void {
    const { gravity, spin } = this.params;

    this.angle = (this.angle + spin * dt) % (Math.PI * 2);
    this.computeEdges();

    // Semi-implicit Euler: update velocity from acceleration first, then
    // position from the *new* velocity (symplectic — bounded energy drift).
    for (const b of this.balls) {
      b.vy += gravity * dt;
      const sp = Math.hypot(b.vx, b.vy);
      if (sp > MAX_SPEED) {
        const k = MAX_SPEED / sp;
        b.vx *= k;
        b.vy *= k;
      }
      b.x += b.vx * dt;
      b.y += b.vy * dt;
    }

    // Two solver iterations per substep settle stacked contacts cleanly.
    for (let iter = 0; iter < 2; iter++) {
      this.solveBallBall(iter === 0, dt);
      this.solveWalls(iter === 0, dt);
    }
  }

  /** Return and clear all contact events recorded since the last call. */
  takeEvents(): ContactEvent[] {
    const out = this.events;
    this.events = [];
    return out;
  }

  /** Total kinetic and gravitational potential energy (J). PE is measured
   *  from the lowest point of the container's bounding circle. */
  energy(): { ke: number; pe: number; total: number } {
    const { gravity, radius } = this.params;
    let ke = 0;
    let pe = 0;
    for (const b of this.balls) {
      ke += 0.5 * b.m * (b.vx * b.vx + b.vy * b.vy);
      pe += b.m * gravity * (radius - b.y); // y is down, so height = R − y
    }
    return { ke, pe, total: ke + pe };
  }

  /** Total linear momentum (kg·m/s) — conserved across ball–ball contacts. */
  momentum(): { px: number; py: number; mag: number } {
    let px = 0;
    let py = 0;
    for (const b of this.balls) {
      px += b.m * b.vx;
      py += b.m * b.vy;
    }
    return { px, py, mag: Math.hypot(px, py) };
  }

  /** Add a ball. Position defaults to a random non-overlapping spot. */
  addBall(x?: number, y?: number, r?: number): Ball {
    const radius =
      r ?? BALL_R_MIN + Math.random() * (BALL_R_MAX - BALL_R_MIN);
    const m = GLASS_DENSITY * (4 / 3) * Math.PI * radius ** 3; // sphere mass

    let px = x;
    let py = y;
    if (px === undefined || py === undefined) {
      const reach = this.params.radius * 0.66;
      for (let attempt = 0; attempt < 50; attempt++) {
        const a = Math.random() * Math.PI * 2;
        const d = Math.sqrt(Math.random()) * reach;
        px = Math.cos(a) * d;
        py = Math.sin(a) * d - this.params.radius * 0.15;
        if (!this.overlapsAny(px, py, radius)) break;
      }
    }

    const ball: Ball = {
      id: this.nextId++,
      x: px ?? 0,
      y: py ?? 0,
      vx: (Math.random() - 0.5) * 1.0,
      vy: (Math.random() - 0.5) * 1.0,
      r: radius,
      m,
      invM: 1 / m,
      colorIndex: Math.floor(Math.random() * 6),
    };
    this.balls.push(ball);
    return ball;
  }

  removeOldest(): void {
    this.balls.shift();
  }

  private overlapsAny(x: number, y: number, r: number): boolean {
    for (const b of this.balls) {
      const dx = b.x - x;
      const dy = b.y - y;
      const rr = b.r + r + 0.02;
      if (dx * dx + dy * dy < rr * rr) return true;
    }
    return false;
  }

  private computeEdges(): void {
    const { radius, sides } = this.params;
    this.edges.length = 0;
    for (let i = 0; i < sides; i++) {
      const a0 = this.angle + (i / sides) * Math.PI * 2;
      const a1 = this.angle + ((i + 1) / sides) * Math.PI * 2;
      const ax = Math.cos(a0) * radius;
      const ay = Math.sin(a0) * radius;
      const bx = Math.cos(a1) * radius;
      const by = Math.sin(a1) * radius;
      // Inward unit normal: the perpendicular that points at the centre.
      const mx = (ax + bx) / 2;
      const my = (ay + by) / 2;
      let nx = by - ay;
      let ny = ax - bx;
      if (nx * mx + ny * my > 0) {
        nx = -nx;
        ny = -ny;
      }
      const len = Math.hypot(nx, ny) || 1;
      this.edges.push({ ax, ay, bx, by, nx: nx / len, ny: ny / len });
    }
  }

  /**
   * Ball–ball contacts. Impulse j is applied along the contact normal with
   * +j·n on one body and −j·n on the other (Newton's 3rd law), so momentum
   * is conserved exactly. j = −(1+e)·(v_rel·n) / (1/m₁ + 1/m₂).
   */
  private solveBallBall(recordEvents: boolean, dt: number): void {
    const e = this.params.restitution;
    // Below this approach speed contacts are treated as perfectly inelastic
    // (standard resting-contact treatment — kills micro-bounce jitter).
    const restThreshold = Math.max(2 * this.params.gravity * dt, 0.02);
    const n = this.balls.length;

    for (let i = 0; i < n; i++) {
      const a = this.balls[i];
      for (let j = i + 1; j < n; j++) {
        const b = this.balls[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const rSum = a.r + b.r;
        const distSq = dx * dx + dy * dy;
        if (distSq >= rSum * rSum || distSq < 1e-12) continue;

        const dist = Math.sqrt(distSq);
        const nx = dx / dist;
        const ny = dy / dist;

        // Positional correction, split by inverse mass.
        const depth = rSum - dist;
        const corr =
          (Math.max(depth - SLOP, 0) * CORRECTION) / (a.invM + b.invM);
        a.x -= nx * corr * a.invM;
        a.y -= ny * corr * a.invM;
        b.x += nx * corr * b.invM;
        b.y += ny * corr * b.invM;

        // Relative velocity along the normal.
        const rvx = b.vx - a.vx;
        const rvy = b.vy - a.vy;
        const vn = rvx * nx + rvy * ny;
        if (vn >= 0) continue; // already separating

        const eEff = -vn > restThreshold ? e : 0;
        const jImp = (-(1 + eEff) * vn) / (a.invM + b.invM);
        a.vx -= jImp * nx * a.invM;
        a.vy -= jImp * ny * a.invM;
        b.vx += jImp * nx * b.invM;
        b.vy += jImp * ny * b.invM;

        if (recordEvents && -vn > MIN_EVENT_IMPACT) {
          this.events.push({
            kind: "ball",
            x: a.x + nx * a.r,
            y: a.y + ny * a.r,
            impact: -vn,
            r: Math.min(a.r, b.r),
            colorIndex: a.colorIndex,
            id: a.id,
          });
        }
      }
    }
  }

  /**
   * Ball–wall contacts against the rotating container. The wall is kinematic
   * (infinite mass): impulses change only the ball. The wall surface point
   * moves at v_wall = ω × r, so restitution and friction act on the velocity
   * of the ball *relative to the moving surface*.
   */
  private solveWalls(recordEvents: boolean, dt: number): void {
    const { restitution: e, wallFriction: mu, spin } = this.params;
    const restThreshold = Math.max(2 * this.params.gravity * dt, 0.02);

    for (const b of this.balls) {
      // Failsafe: if the centre somehow ends up outside the convex polygon,
      // project it back inside and kill the outward velocity component.
      let minS = Infinity;
      let minEdge: Edge | null = null;
      for (const ed of this.edges) {
        const s = (b.x - ed.ax) * ed.nx + (b.y - ed.ay) * ed.ny;
        if (s < minS) {
          minS = s;
          minEdge = ed;
        }
      }
      if (minEdge && minS < 0) {
        b.x += minEdge.nx * (b.r - minS);
        b.y += minEdge.ny * (b.r - minS);
        const vOut = b.vx * minEdge.nx + b.vy * minEdge.ny;
        if (vOut < 0) {
          b.vx -= vOut * minEdge.nx;
          b.vy -= vOut * minEdge.ny;
        }
        continue;
      }

      for (const ed of this.edges) {
        // Distance from this edge plane — quick reject.
        const s = (b.x - ed.ax) * ed.nx + (b.y - ed.ay) * ed.ny;
        if (s >= b.r) continue;

        // Closest point on the edge segment (handles corners too).
        const ex = ed.bx - ed.ax;
        const ey = ed.by - ed.ay;
        let t = ((b.x - ed.ax) * ex + (b.y - ed.ay) * ey) / (ex * ex + ey * ey);
        t = Math.max(0, Math.min(1, t));
        const px = ed.ax + ex * t;
        const py = ed.ay + ey * t;

        const dx = b.x - px;
        const dy = b.y - py;
        const dist = Math.hypot(dx, dy);
        if (dist >= b.r || dist < 1e-9) continue;

        const nx = dx / dist; // contact normal, pointing into the arena
        const ny = dy / dist;

        // Positional correction: push the ball fully out of the rigid wall.
        const depth = b.r - dist;
        b.x += nx * Math.max(depth - SLOP, 0);
        b.y += ny * Math.max(depth - SLOP, 0);

        // Wall surface velocity at the contact point: v = ω × r.
        const wvx = -spin * py;
        const wvy = spin * px;

        const rvx = b.vx - wvx;
        const rvy = b.vy - wvy;
        const vn = rvx * nx + rvy * ny;
        if (vn >= 0) continue;

        // Normal impulse (per unit mass — the wall has infinite mass).
        const eEff = -vn > restThreshold ? e : 0;
        const jn = -(1 + eEff) * vn;
        b.vx += jn * nx;
        b.vy += jn * ny;

        // Coulomb friction: oppose tangential sliding, clamped to μ·|j_n|
        // and to the sliding speed itself (friction never reverses slip).
        const tvx = rvx - vn * nx;
        const tvy = rvy - vn * ny;
        const tv = Math.hypot(tvx, tvy);
        if (tv > 1e-9) {
          const jt = Math.min(mu * jn, tv);
          b.vx -= (tvx / tv) * jt;
          b.vy -= (tvy / tv) * jt;
        }

        if (recordEvents && -vn > MIN_EVENT_IMPACT) {
          this.events.push({
            kind: "wall",
            x: px,
            y: py,
            impact: -vn,
            r: b.r,
            colorIndex: b.colorIndex,
            id: b.id,
          });
        }
      }
    }
  }
}
