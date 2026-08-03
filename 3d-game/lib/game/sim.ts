// NEON VOID — core simulation. Pure TS, no three.js. Runs on the xz plane (y is up).

export const ARENA_R = 26;

export type EnemyKind = "chaser" | "speeder" | "splitter" | "mini" | "shooter" | "tank";
export type PickupKind = "shard" | "heal" | "triple" | "rapid" | "shield";

export interface Enemy {
  kind: EnemyKind;
  x: number; z: number;
  vx: number; vz: number;
  hp: number; maxHp: number;
  r: number; speed: number; dmg: number; score: number;
  seed: number;
  spawnT: number; // >0 = warning ring phase, not yet active
  age: number;    // time since activation (for grow-in)
  flash: number;  // hit flash timer
  fireCd: number; // shooter only
}

export interface Bullet { x: number; z: number; vx: number; vz: number; life: number; dmg: number; r: number }
export interface Pickup { kind: PickupKind; x: number; z: number; life: number; seed: number }
export interface Particle {
  x: number; y: number; z: number;
  vx: number; vy: number; vz: number;
  life: number; maxLife: number; size: number;
  cr: number; cg: number; cb: number;
}
export interface Shockwave { x: number; z: number; maxR: number; life: number; maxLife: number; cr: number; cg: number; cb: number }
export interface SimEvent { type: string; mag?: number }

export const ENEMY_DEFS: Record<EnemyKind, {
  hp: number; speed: number; r: number; dmg: number; score: number; color: [number, number, number];
}> = {
  chaser:   { hp: 3,  speed: 6.5,  r: 0.8,  dmg: 12, score: 100, color: [2.6, 0.35, 1.2] },
  speeder:  { hp: 2,  speed: 10.5, r: 0.6,  dmg: 8,  score: 150, color: [2.8, 1.4, 0.25] },
  splitter: { hp: 5,  speed: 5.0,  r: 1.0,  dmg: 14, score: 200, color: [0.4, 2.8, 0.9] },
  mini:     { hp: 1,  speed: 8.5,  r: 0.45, dmg: 6,  score: 50,  color: [0.7, 2.8, 1.4] },
  shooter:  { hp: 4,  speed: 4.5,  r: 0.8,  dmg: 10, score: 250, color: [2.8, 2.4, 0.3] },
  tank:     { hp: 16, speed: 3.2,  r: 1.5,  dmg: 25, score: 400, color: [1.6, 0.5, 3.0] },
};

export const PICKUP_COLORS: Record<PickupKind, [number, number, number]> = {
  shard:  [0.4, 2.6, 3.0],
  heal:   [0.4, 3.0, 0.8],
  triple: [3.0, 1.6, 0.3],
  rapid:  [3.0, 2.8, 0.4],
  shield: [0.5, 1.2, 3.2],
};

const PLAYER_R = 0.7;
const PLAYER_ACCEL = 70;
const PLAYER_MAX_SPEED = 13;
const PLAYER_FRICTION = 6.5;
const DASH_SPEED = 36;
const DASH_CD = 1.6;
const DASH_IFRAMES = 0.4;
const HIT_IFRAMES = 1.0;
const BULLET_SPEED = 32;
const BULLET_LIFE = 1.5;
const BASE_FIRE_CD = 0.16;
const POWERUP_TIME = 12;
const SHIELD_TIME = 6;
const INTERMISSION = 3.2;

const rand = (a: number, b: number) => a + Math.random() * (b - a);

export class Sim {
  // player
  px = 0; pz = 0; pvx = 0; pvz = 0;
  aimX = 0; aimZ = -1; // normalized aim direction
  hp = 100; maxHp = 100;
  iframes = 0; dashCd = 0; fireCd = 0; shiftHeld = false;
  triple = 0; rapid = 0; shield = 0;
  weaponLvl = 1; shards = 0;
  dead = false; deathTimer = 0; over = false;

  // run stats
  score = 0; kills = 0; time = 0;
  streak = 0; mult = 1;

  // wave
  wave = 0;
  spawnQueue: EnemyKind[] = [];
  spawnTimer = 0;
  intermission = 0;

  // entities
  enemies: Enemy[] = [];
  bullets: Bullet[] = [];
  ebullets: Bullet[] = [];
  pickups: Pickup[] = [];
  particles: Particle[] = [];
  shockwaves: Shockwave[] = [];

  // feedback
  trauma = 0;       // camera shake 0..1
  hurtFlash = 0;    // red vignette 0..1
  events: SimEvent[] = [];

  // input (written by the input system)
  keys = new Set<string>();
  aimPx = 0; aimPz = -1; // world point the cursor hovers
  firing = false;
  autopilot = false; // when true, the input system leaves aim/fire alone (demo & tests)

  reset() {
    this.px = 0; this.pz = 0; this.pvx = 0; this.pvz = 0;
    this.aimX = 0; this.aimZ = -1;
    this.hp = 100; this.maxHp = 100;
    this.iframes = 0; this.dashCd = 0; this.fireCd = 0; this.shiftHeld = false;
    this.triple = 0; this.rapid = 0; this.shield = 0;
    this.weaponLvl = 1; this.shards = 0;
    this.dead = false; this.deathTimer = 0; this.over = false;
    this.score = 0; this.kills = 0; this.time = 0;
    this.streak = 0; this.mult = 1;
    this.wave = 0; this.spawnQueue = []; this.spawnTimer = 0;
    this.intermission = 1.2; // short ramp into wave 1
    this.enemies = []; this.bullets = []; this.ebullets = [];
    this.pickups = []; this.particles = []; this.shockwaves = [];
    this.trauma = 0; this.hurtFlash = 0; this.events = [];
    this.firing = false;
  }

  shardsNeeded() { return 25 + this.weaponLvl * 15; }

  update(dt: number) {
    if (this.over) return;
    // slow-motion death sequence before the game-over screen
    if (this.dead) {
      dt *= 0.3;
      this.deathTimer -= dt;
      if (this.deathTimer <= 0) {
        this.over = true;
        this.events.push({ type: "over" });
      }
    }

    this.time += dt;
    this.trauma = Math.max(0, this.trauma - 1.4 * dt);
    this.hurtFlash = Math.max(0, this.hurtFlash - 2.0 * dt);

    if (!this.dead) this.updatePlayer(dt);
    this.updateWave(dt);
    this.updateEnemies(dt);
    this.updateBullets(dt);
    this.updatePickups(dt);
    this.updateFx(dt);
  }

  private updatePlayer(dt: number) {
    this.iframes = Math.max(0, this.iframes - dt);
    this.dashCd = Math.max(0, this.dashCd - dt);
    this.fireCd = Math.max(0, this.fireCd - dt);
    this.triple = Math.max(0, this.triple - dt);
    this.rapid = Math.max(0, this.rapid - dt);
    this.shield = Math.max(0, this.shield - dt);

    // movement input
    const k = this.keys;
    let ix = 0, iz = 0;
    if (k.has("w") || k.has("arrowup")) iz -= 1;
    if (k.has("s") || k.has("arrowdown")) iz += 1;
    if (k.has("a") || k.has("arrowleft")) ix -= 1;
    if (k.has("d") || k.has("arrowright")) ix += 1;
    const il = Math.hypot(ix, iz);
    if (il > 0) { ix /= il; iz /= il; }

    // dash (edge-triggered: release shift between dashes)
    if (k.has("shift")) {
      if (!this.shiftHeld && this.dashCd <= 0) {
        let dx = ix, dz = iz;
        if (il === 0) { dx = this.aimX; dz = this.aimZ; }
        this.pvx = dx * DASH_SPEED;
        this.pvz = dz * DASH_SPEED;
        this.dashCd = DASH_CD;
        this.iframes = Math.max(this.iframes, DASH_IFRAMES);
        this.events.push({ type: "dash" });
        for (let i = 0; i < 10; i++) {
          this.spawnParticle(this.px, 0.5, this.pz, -dx * rand(2, 6) + rand(-2, 2), rand(0, 2), -dz * rand(2, 6) + rand(-2, 2), rand(0.25, 0.5), rand(0.1, 0.25), 0.4, 2.6, 3.0);
        }
      }
      this.shiftHeld = true;
    } else {
      this.shiftHeld = false;
    }

    this.pvx += ix * PLAYER_ACCEL * dt;
    this.pvz += iz * PLAYER_ACCEL * dt;
    const fr = Math.exp(-PLAYER_FRICTION * dt);
    this.pvx *= fr; this.pvz *= fr;
    const sp = Math.hypot(this.pvx, this.pvz);
    const maxSp = this.dashCd > DASH_CD - 0.2 ? DASH_SPEED : PLAYER_MAX_SPEED;
    if (sp > maxSp) { this.pvx *= maxSp / sp; this.pvz *= maxSp / sp; }
    this.px += this.pvx * dt;
    this.pz += this.pvz * dt;

    // keep inside arena
    const d = Math.hypot(this.px, this.pz);
    const lim = ARENA_R - PLAYER_R - 0.3;
    if (d > lim) {
      this.px *= lim / d; this.pz *= lim / d;
      const nx = this.px / lim, nz = this.pz / lim;
      const vn = this.pvx * nx + this.pvz * nz;
      if (vn > 0) { this.pvx -= vn * nx; this.pvz -= vn * nz; }
    }

    // aim
    const ax = this.aimPx - this.px, az = this.aimPz - this.pz;
    const al = Math.hypot(ax, az);
    if (al > 0.001) { this.aimX = ax / al; this.aimZ = az / al; }

    // fire
    if (this.firing && this.fireCd <= 0) {
      this.fire();
      let cd = BASE_FIRE_CD;
      if (this.rapid > 0) cd *= 0.45;
      if (this.weaponLvl >= 3) cd *= 0.88;
      this.fireCd = cd;
    }
  }

  private fire() {
    const dirs: [number, number][] = [];
    const ax = this.aimX, az = this.aimZ;
    // perpendicular for parallel streams
    const px = -az, pz = ax;
    if (this.weaponLvl === 1) {
      dirs.push([0, 0]); // [perpOffset, angleOffset] encoded below
    } else if (this.weaponLvl === 2) {
      dirs.push([-0.28, 0], [0.28, 0]);
    } else {
      dirs.push([-0.34, 0], [0, 0], [0.34, 0]);
    }
    const shots: { ox: number; oz: number; dx: number; dz: number }[] = [];
    for (const [off] of dirs) {
      shots.push({ ox: px * off, oz: pz * off, dx: ax, dz: az });
    }
    if (this.triple > 0) {
      for (const ang of [-0.2, 0.2]) {
        const c = Math.cos(ang), s = Math.sin(ang);
        shots.push({ ox: 0, oz: 0, dx: ax * c - az * s, dz: ax * s + az * c });
      }
    }
    for (const s of shots) {
      this.bullets.push({
        x: this.px + s.dx * 1.0 + s.ox,
        z: this.pz + s.dz * 1.0 + s.oz,
        vx: s.dx * BULLET_SPEED, vz: s.dz * BULLET_SPEED,
        life: BULLET_LIFE, dmg: 1, r: 0.25,
      });
    }
    this.events.push({ type: "shoot" });
  }

  private updateWave(dt: number) {
    if (this.dead) return;
    if (this.intermission > 0) {
      this.intermission -= dt;
      if (this.intermission <= 0) {
        this.wave += 1;
        this.spawnQueue = this.buildWave(this.wave);
        this.spawnTimer = 0.5;
        this.events.push({ type: "wave" });
      }
      return;
    }
    if (this.spawnQueue.length > 0) {
      this.spawnTimer -= dt;
      if (this.spawnTimer <= 0) {
        const burst = Math.min(this.spawnQueue.length, 1 + Math.floor(Math.random() * 2));
        for (let i = 0; i < burst; i++) this.spawnEnemy(this.spawnQueue.pop()!);
        this.spawnTimer = Math.max(0.3, 1.15 - this.wave * 0.04) * rand(0.8, 1.2);
      }
    } else if (this.enemies.length === 0) {
      // wave cleared
      this.score += 250 * this.wave;
      this.hp = Math.min(this.maxHp, this.hp + 12);
      this.intermission = INTERMISSION;
      this.events.push({ type: "clear" });
    }
  }

  private buildWave(w: number): EnemyKind[] {
    const total = Math.min(6 + w * 3, 46);
    const q: EnemyKind[] = [];
    const tanks = w >= 5 ? Math.min(4, Math.floor((w - 2) / 3)) : 0;
    for (let i = 0; i < tanks; i++) q.push("tank");
    for (let i = q.length; i < total; i++) {
      const roll = Math.random();
      if (w >= 4 && roll < 0.16) q.push("shooter");
      else if (w >= 3 && roll < 0.36) q.push("splitter");
      else if (w >= 2 && roll < 0.62) q.push("speeder");
      else q.push("chaser");
    }
    // shuffle
    for (let i = q.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [q[i], q[j]] = [q[j], q[i]];
    }
    return q;
  }

  private spawnEnemy(kind: EnemyKind, atX?: number, atZ?: number) {
    const def = ENEMY_DEFS[kind];
    let x = atX ?? 0, z = atZ ?? 0;
    if (atX === undefined) {
      for (let tries = 0; tries < 12; tries++) {
        const a = Math.random() * Math.PI * 2;
        const r = rand(ARENA_R * 0.45, ARENA_R - 2.5);
        x = Math.cos(a) * r; z = Math.sin(a) * r;
        if (Math.hypot(x - this.px, z - this.pz) > 9) break;
      }
    }
    const hpScale = 1 + (this.wave - 1) * 0.07;
    const spScale = Math.min(1.35, 1 + (this.wave - 1) * 0.02);
    this.enemies.push({
      kind, x, z, vx: 0, vz: 0,
      hp: def.hp * hpScale, maxHp: def.hp * hpScale,
      r: def.r, speed: def.speed * spScale, dmg: def.dmg, score: def.score,
      seed: rand(0.6, 1.6) * (Math.random() < 0.5 ? -1 : 1),
      spawnT: atX === undefined ? 1.0 : 0.25,
      age: 0, flash: 0, fireCd: rand(1.0, 2.2),
    });
  }

  private updateEnemies(dt: number) {
    const es = this.enemies;
    for (let i = es.length - 1; i >= 0; i--) {
      const e = es[i];
      if (e.spawnT > 0) { e.spawnT -= dt; continue; }
      e.age += dt;
      e.flash = Math.max(0, e.flash - 5 * dt);

      // steering
      let tx = this.px - e.x, tz = this.pz - e.z;
      const dist = Math.hypot(tx, tz) || 0.001;
      tx /= dist; tz /= dist;

      if (e.kind === "shooter") {
        // hold a firing ring, strafe, shoot
        const want = 10.5;
        const radial = dist > want + 1.5 ? 1 : dist < want - 1.5 ? -0.8 : 0;
        const strafe = Math.sin(this.time * 0.7 * e.seed) > 0 ? 1 : -1;
        e.vx += (tx * radial + -tz * strafe * 0.7) * e.speed * 2.4 * dt;
        e.vz += (tz * radial + tx * strafe * 0.7) * e.speed * 2.4 * dt;
        if (!this.dead) {
          e.fireCd -= dt;
          if (e.fireCd <= 0 && dist < 18) {
            e.fireCd = 2.2;
            this.ebullets.push({ x: e.x, z: e.z, vx: tx * 11, vz: tz * 11, life: 3.5, dmg: e.dmg, r: 0.32 });
            this.events.push({ type: "eshoot" });
          }
        }
      } else {
        // weave a little so swarms feel organic
        const wob = Math.sin(this.time * 2.1 * e.seed + e.seed * 7) * 0.35;
        const wx = tx - tz * wob, wz = tz + tx * wob;
        e.vx += wx * e.speed * 2.6 * dt;
        e.vz += wz * e.speed * 2.6 * dt;
      }

      // separation from other enemies
      for (let j = i - 1; j >= 0; j--) {
        const o = es[j];
        if (o.spawnT > 0) continue;
        const dx = e.x - o.x, dz = e.z - o.z;
        const rr = e.r + o.r;
        const dd = dx * dx + dz * dz;
        if (dd < rr * rr && dd > 0.0001) {
          const d = Math.sqrt(dd);
          const push = ((rr - d) / d) * 14 * dt;
          e.vx += dx * push; e.vz += dz * push;
          o.vx -= dx * push; o.vz -= dz * push;
        }
      }

      // damp + clamp speed
      const fr = Math.exp(-2.2 * dt);
      e.vx *= fr; e.vz *= fr;
      const sp = Math.hypot(e.vx, e.vz);
      if (sp > e.speed) { e.vx *= e.speed / sp; e.vz *= e.speed / sp; }
      e.x += e.vx * dt; e.z += e.vz * dt;

      // arena clamp
      const d0 = Math.hypot(e.x, e.z);
      const lim = ARENA_R - e.r;
      if (d0 > lim) { e.x *= lim / d0; e.z *= lim / d0; }

      // touch player
      if (!this.dead && this.iframes <= 0 && dist < e.r + PLAYER_R) {
        this.damagePlayer(e.dmg, tx, tz, e.kind === "tank" ? 26 : 18);
        e.vx = -tx * 8; e.vz = -tz * 8;
      }
    }
  }

  private updateBullets(dt: number) {
    // player bullets
    const bs = this.bullets;
    for (let i = bs.length - 1; i >= 0; i--) {
      const b = bs[i];
      b.life -= dt;
      b.x += b.vx * dt; b.z += b.vz * dt;
      let hit = false;
      if (b.life > 0 && Math.hypot(b.x, b.z) < ARENA_R + 2) {
        for (let j = this.enemies.length - 1; j >= 0; j--) {
          const e = this.enemies[j];
          if (e.spawnT > 0) continue;
          const dx = e.x - b.x, dz = e.z - b.z;
          const rr = e.r + b.r;
          if (dx * dx + dz * dz < rr * rr) {
            e.hp -= b.dmg;
            e.flash = 1;
            // impact sparks
            for (let p = 0; p < 3; p++) {
              this.spawnParticle(b.x, 0.8, b.z, -b.vx * 0.04 + rand(-3, 3), rand(1, 4), -b.vz * 0.04 + rand(-3, 3), rand(0.15, 0.3), rand(0.06, 0.14), 0.5, 2.4, 3.0);
            }
            e.vx += b.vx * 0.02; e.vz += b.vz * 0.02;
            if (e.hp <= 0) this.killEnemy(j);
            hit = true;
            break;
          }
        }
      } else hit = true;
      if (hit) { bs[i] = bs[bs.length - 1]; bs.pop(); }
    }

    // enemy bullets
    const eb = this.ebullets;
    for (let i = eb.length - 1; i >= 0; i--) {
      const b = eb[i];
      b.life -= dt;
      b.x += b.vx * dt; b.z += b.vz * dt;
      let gone = b.life <= 0 || Math.hypot(b.x, b.z) > ARENA_R + 2;
      if (!gone && !this.dead && this.iframes <= 0) {
        const dx = this.px - b.x, dz = this.pz - b.z;
        const rr = b.r + PLAYER_R;
        if (dx * dx + dz * dz < rr * rr) {
          const d = Math.hypot(dx, dz) || 1;
          this.damagePlayer(b.dmg, dx / d, dz / d, 10);
          gone = true;
        }
      }
      if (gone) { eb[i] = eb[eb.length - 1]; eb.pop(); }
    }
  }

  private killEnemy(idx: number) {
    const e = this.enemies[idx];
    this.enemies[idx] = this.enemies[this.enemies.length - 1];
    this.enemies.pop();

    this.kills += 1;
    this.streak += 1;
    this.mult = Math.min(9, 1 + Math.floor(this.streak / 4));
    this.score += e.score * this.mult;

    const def = ENEMY_DEFS[e.kind];
    const [cr, cg, cb] = def.color;
    const big = e.kind === "tank";
    const n = big ? 26 : e.kind === "mini" ? 8 : 14;
    for (let p = 0; p < n; p++) {
      const a = Math.random() * Math.PI * 2;
      const v = rand(2, big ? 12 : 8);
      this.spawnParticle(e.x, 0.8, e.z, Math.cos(a) * v, rand(0.5, 5), Math.sin(a) * v, rand(0.35, big ? 0.9 : 0.6), rand(0.08, big ? 0.3 : 0.2), cr, cg, cb);
    }
    this.shockwaves.push({ x: e.x, z: e.z, maxR: big ? 4.5 : 2.4, life: 0.45, maxLife: 0.45, cr, cg, cb });
    this.trauma = Math.min(1, this.trauma + (big ? 0.35 : 0.12));
    this.events.push({ type: "boom", mag: big ? 1 : 0.4 });

    if (e.kind === "splitter") {
      for (let s = 0; s < 3; s++) {
        const a = Math.random() * Math.PI * 2;
        this.spawnEnemy("mini", e.x + Math.cos(a) * 0.8, e.z + Math.sin(a) * 0.8);
      }
    }

    // drops
    const drop = (kind: PickupKind, jitter = 0.8) => {
      this.pickups.push({ kind, x: e.x + rand(-jitter, jitter), z: e.z + rand(-jitter, jitter), life: 12, seed: Math.random() * 10 });
    };
    if (e.kind === "tank") { drop("shard"); drop("shard"); drop("shard"); }
    else if (Math.random() < 0.45) drop("shard");
    if (Math.random() < 0.08) {
      const roll = Math.random();
      drop(roll < 0.3 ? "heal" : roll < 0.55 ? "triple" : roll < 0.8 ? "rapid" : "shield", 0.2);
    }
  }

  private damagePlayer(dmg: number, nx: number, nz: number, knock: number) {
    // knockback away from the threat (nx,nz points threat -> player)
    this.pvx += nx * knock; this.pvz += nz * knock;
    if (this.shield > 0) {
      this.events.push({ type: "deflect" });
      this.iframes = Math.max(this.iframes, 0.3);
      return;
    }
    this.hp -= dmg;
    this.iframes = HIT_IFRAMES;
    this.streak = 0; this.mult = 1;
    this.trauma = Math.min(1, this.trauma + 0.45);
    this.hurtFlash = 1;
    this.events.push({ type: "phit" });
    for (let p = 0; p < 12; p++) {
      const a = Math.random() * Math.PI * 2;
      const v = rand(2, 7);
      this.spawnParticle(this.px, 0.6, this.pz, Math.cos(a) * v, rand(0.5, 4), Math.sin(a) * v, rand(0.3, 0.5), rand(0.08, 0.18), 3.0, 0.4, 0.3);
    }
    if (this.hp <= 0) {
      this.hp = 0;
      this.dead = true;
      this.deathTimer = 1.6;
      this.trauma = 1;
      this.events.push({ type: "death" });
      for (let p = 0; p < 50; p++) {
        const a = Math.random() * Math.PI * 2;
        const v = rand(2, 14);
        this.spawnParticle(this.px, 0.7, this.pz, Math.cos(a) * v, rand(1, 8), Math.sin(a) * v, rand(0.5, 1.4), rand(0.1, 0.32), 0.5, 2.4, 3.0);
      }
      this.shockwaves.push({ x: this.px, z: this.pz, maxR: 7, life: 0.8, maxLife: 0.8, cr: 0.5, cg: 2.4, cb: 3.0 });
    }
  }

  private updatePickups(dt: number) {
    const ps = this.pickups;
    for (let i = ps.length - 1; i >= 0; i--) {
      const p = ps[i];
      p.life -= dt;
      let gone = p.life <= 0;
      if (!gone && !this.dead) {
        const dx = this.px - p.x, dz = this.pz - p.z;
        const d = Math.hypot(dx, dz);
        // magnet shards
        if (p.kind === "shard" && d < 5 && d > 0.01) {
          const pull = (1 - d / 5) * 26 * dt;
          p.x += (dx / d) * pull; p.z += (dz / d) * pull;
        }
        if (d < PLAYER_R + 0.7) {
          this.collect(p);
          gone = true;
        }
      }
      if (gone) { ps[i] = ps[ps.length - 1]; ps.pop(); }
    }
  }

  private collect(p: Pickup) {
    const [cr, cg, cb] = PICKUP_COLORS[p.kind];
    for (let i = 0; i < 8; i++) {
      const a = Math.random() * Math.PI * 2;
      this.spawnParticle(p.x, 0.6, p.z, Math.cos(a) * rand(1, 4), rand(2, 5), Math.sin(a) * rand(1, 4), rand(0.2, 0.4), rand(0.06, 0.14), cr, cg, cb);
    }
    switch (p.kind) {
      case "shard":
        this.score += 25 * this.mult;
        this.shards += 1;
        if (this.weaponLvl < 3 && this.shards >= this.shardsNeeded()) {
          this.shards -= this.shardsNeeded();
          this.weaponLvl += 1;
          this.events.push({ type: "levelup" });
        } else {
          this.events.push({ type: "pickup" });
        }
        break;
      case "heal":
        this.hp = Math.min(this.maxHp, this.hp + 30);
        this.events.push({ type: "power" });
        break;
      case "triple": this.triple = POWERUP_TIME; this.events.push({ type: "power" }); break;
      case "rapid": this.rapid = POWERUP_TIME; this.events.push({ type: "power" }); break;
      case "shield": this.shield = SHIELD_TIME; this.events.push({ type: "power" }); break;
    }
  }

  private spawnParticle(x: number, y: number, z: number, vx: number, vy: number, vz: number, life: number, size: number, cr: number, cg: number, cb: number) {
    if (this.particles.length > 700) return;
    this.particles.push({ x, y, z, vx, vy, vz, life, maxLife: life, size, cr, cg, cb });
  }

  private updateFx(dt: number) {
    const ps = this.particles;
    for (let i = ps.length - 1; i >= 0; i--) {
      const p = ps[i];
      p.life -= dt;
      if (p.life <= 0) { ps[i] = ps[ps.length - 1]; ps.pop(); continue; }
      p.vy -= 9 * dt;
      p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
      if (p.y < 0.05) { p.y = 0.05; p.vy *= -0.4; }
    }
    const sw = this.shockwaves;
    for (let i = sw.length - 1; i >= 0; i--) {
      sw[i].life -= dt;
      if (sw[i].life <= 0) { sw[i] = sw[sw.length - 1]; sw.pop(); }
    }
  }
}

export const sim = new Sim();

// debug handle (also used by automated playtests)
declare global {
  interface Window { __sim?: Sim }
}
if (typeof window !== "undefined") window.__sim = sim;
