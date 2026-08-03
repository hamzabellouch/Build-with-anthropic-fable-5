// Core simulation: 6-DOF rigid body + 4 motor/prop units + battery + FC,
// integrated with semi-implicit Euler at a fixed 1 kHz timestep.
//
// Forces modeled:
//   - per-motor thrust along body +Y with advance-ratio washout (motor.js),
//     each motor seeing its own local inflow (v + w x r), which yields
//     roll/pitch aerodynamic damping for free
//   - gravity
//   - quadratic body drag with per-axis CdA (frame is not symmetric)
//   - rotor in-plane drag (H-force): props moving edgewise drag against the
//     air proportional to RPM * lateral airspeed, applied at each motor
//     position (above the CG -> realistic pitch coupling at speed)
//   - ground effect (Cheeseman-Bennett) below ~1 prop diameter
//   - propwash: descending into your own wake adds band-limited thrust
//     turbulence per motor that the PID has to fight (the familiar shake)
//   - wind: steady + Ornstein-Uhlenbeck gusts
// Torques additionally include prop reaction torque (yaw), gyroscopic
// precession of rotor angular momentum, and spool-up reaction (yaw kick).

import {
  v3, quat, vadd, vsub, vscale, vaddScaled, vcross, vdot, vlen, vcopy, vset, vzero,
  qrotate, qrotateInv, qintegrate, qcopy, qidentity, qfromAxisAngle, qmul,
  clamp, OUNoise, TAU,
} from './math.js';
import { Motor, Battery } from './motor.js';
import { FlightController } from './fc.js';
import { resolveCollisions } from './collision.js';

export const PHYS_DT = 1 / 1000;
const G = 9.80665;
const UP = [0, 1, 0];

export class Simulation {
  constructor(cfg, env = {}) {
    this.cfg = cfg;
    this.rho = env.rho ?? 1.225;
    this.colliders = env.colliders ?? [];
    this.wind = { dir: 0, speed: 0, gust: 0, ...(env.wind || {}) };

    this.motors = cfg.motors.map(() => new Motor(cfg.motor, cfg.prop));
    this.battery = new Battery(cfg.battery);
    this.fc = new FlightController(cfg, PHYS_DT);

    // State
    this.pos = v3(0, 0.04, 0);
    this.vel = v3();
    this.q = quat();          // body -> world
    this.omega = v3();        // body frame, rad/s
    this.time = 0;
    this.flightTime = 0;
    this.crashed = false;
    this.lastImpact = 0;      // m/s, for crash/audio events
    this.contact = false;

    this.inputs = { roll: 0, pitch: 0, yaw: 0, throttle: 0 };

    // Precompute
    this.invMass = 1 / cfg.mass;
    this.I = cfg.inertia;
    this.invI = [1 / this.I[0], 1 / this.I[1], 1 / this.I[2]];
    const Iavg = (this.I[0] + this.I[1] + this.I[2]) / 3;
    this.invIavg = [1 / Iavg, 1 / Iavg, 1 / Iavg];

    // Propwash noise generators, one per motor (~35 Hz bandwidth).
    this.washNoise = cfg.motors.map(() => new OUNoise(0.028, 1.0));
    this.washTorque = [new OUNoise(0.05, 1.0), new OUNoise(0.05, 1.0), new OUNoise(0.05, 1.0)];
    this.gustNoise = [new OUNoise(2.0, 1.0), new OUNoise(3.0, 0.4), new OUNoise(2.0, 1.0)];
    this.gyroNoiseAmp = 0.004; // rad/s RMS, post-filter realistic

    // Per-motor scratch + readouts
    this.motorPos = cfg.motors.map(m => m.pos);
    this.washLevel = 0;

    // Telemetry ring buffer for the on-screen tuning graph (200 Hz).
    this.trace = [];
    this.traceMax = 600;
    this._traceCnt = 0;

    // Scratch vectors (avoid per-step allocation).
    this._s = Array.from({ length: 12 }, () => v3());
    this._att = { pitch: 0, roll: 0 };
    this._contactPts = cfg.motors.map(() => ({ world: v3(), rBody: v3(), r: cfg.collision.motorR }))
      .concat([{ world: v3(), rBody: v3(), r: cfg.collision.bodyR }]);
  }

  reset(pos = [0, 0.04, 0], yawRad = 0) {
    vcopy(this.pos, pos);
    vzero(this.vel);
    vzero(this.omega);
    qfromAxisAngle(this.q, UP, yawRad);
    this.crashed = false;
    this.lastImpact = 0;
    this.flightTime = 0;
    for (const m of this.motors) m.reset();
    this.fc.disarm();
  }

  swapBattery() { this.battery.reset(); }

  setWind(speed, dirRad, gust) {
    this.wind.speed = speed; this.wind.dir = dirRad; this.wind.gust = gust;
  }

  arm() {
    if (this.crashed) return false;
    if (this.inputs.throttle > 0.1) return false;   // throttle-low arming guard
    this.fc.arm();
    return true;
  }
  disarm() { this.fc.disarm(); }
  get armed() { return this.fc.armed; }

  // Tilt angles for angle mode / OSD. pitch + = nose up, roll + = right down.
  attitude() {
    const s = this._s;
    const fwd = qrotate(s[0], this.q, [0, 0, -1]);
    const right = qrotate(s[1], this.q, [1, 0, 0]);
    this._att.pitch = Math.asin(clamp(fwd[1], -1, 1));
    this._att.roll = -Math.asin(clamp(right[1], -1, 1));
    return this._att;
  }

  step(dt = PHYS_DT) {
    const s = this._s, cfg = this.cfg;
    this.time += dt;
    if (this.fc.armed) this.flightTime += dt;

    // --- flight controller ---
    const gyro = vset(s[11],
      this.omega[0] + this.gyroNoiseAmp * (Math.random() - 0.5) * 2,
      this.omega[1] + this.gyroNoiseAmp * (Math.random() - 0.5) * 2,
      this.omega[2] + this.gyroNoiseAmp * (Math.random() - 0.5) * 2);
    const motorCmds = this.fc.update(this.inputs, gyro, this.attitude(), dt);

    // --- wind (world) ---
    const wSpd = this.wind.speed;
    const wind = vset(s[0],
      Math.cos(this.wind.dir) * wSpd + this.gustNoise[0].update(dt) * this.wind.gust,
      this.gustNoise[1].update(dt) * this.wind.gust,
      Math.sin(this.wind.dir) * wSpd + this.gustNoise[2].update(dt) * this.wind.gust);

    // Air-relative velocity in body frame.
    const vAir = vsub(s[1], this.vel, wind);
    const vAirBody = qrotateInv(s[2], this.q, vAir);

    // --- per-motor thrust/torque ---
    const force = vzero(s[3]);    // body frame
    const torque = vzero(s[4]);   // body frame
    let Itotal = 0, hRotor = 0, hRotorDot = 0;
    let washMax = 0;

    // Lateral speed factor for propwash: clean vertical descent is worst.
    const vLatMag = Math.hypot(vAirBody[0], vAirBody[2]);

    for (let i = 0; i < 4; i++) {
      const m = this.motors[i], r = this.motorPos[i], spin = cfg.motors[i].spin;
      // Local inflow at this rotor (includes rotation-induced flow).
      const vLocal = vadd(s[5], vAirBody, vcross(s[6], this.omega, r));
      const vAxial = vLocal[1];

      // Ground effect (Cheeseman-Bennett), only meaningful near flat ground.
      const fwdW = qrotate(s[6], this.q, r);
      const h = Math.max(this.pos[1] + fwdW[1], cfg.prop.D * 0.25);
      let ge = 1;
      if (h < cfg.prop.D * 1.5) {
        const x = cfg.prop.D / (8 * h);
        ge = clamp(1 / (1 - x * x), 1, 1.35);
      }

      // Propwash turbulence: descending into own wake.
      const wash = clamp((-vAxial - 0.8) / 4.5, 0, 1) * clamp(1.6 - vLatMag / 5, 0, 1)
        * clamp(m.w / 1200, 0, 1) * cfg.aero.propwashGain;
      washMax = Math.max(washMax, wash);
      const ctNoise = clamp(1 - 0.12 * wash + 0.30 * wash * this.washNoise[i].update(dt), 0.3, 1.7);

      Itotal += m.step(motorCmds[i], this.battery.V, vAxial, this.rho, ge, ctNoise, dt);

      // Thrust along body +Y at motor position.
      force[1] += m.thrust;
      torque[0] += -r[2] * m.thrust;   // r x F, F = (0,T,0)
      torque[2] += r[0] * m.thrust;

      // Prop reaction torque (yaw): body receives -spin * Q about +Y.
      torque[1] += -spin * m.torque;

      // Rotor angular momentum (for gyroscopic terms) and spool reaction.
      hRotor += spin * cfg.prop.Jr * m.w;
      hRotorDot += spin * cfg.prop.Jr * m.lastWdot;

      // H-force: in-plane rotor drag ~ rho * n * D^3 * v_lateral.
      const n = m.w / TAU;
      const kh = cfg.aero.Ch * this.rho * n * cfg.prop.D ** 3;
      const fh = vset(s[7], -kh * vLocal[0], 0, -kh * vLocal[2]);
      vadd(force, force, fh);
      vadd(torque, torque, vcross(s[8], r, fh));
    }
    this.washLevel = washMax;
    this.battery.step(Itotal, dt);

    // Propwash also kicks moments directly (asymmetric wake impingement).
    if (washMax > 0.01) {
      const tw = 0.10 * washMax * cfg.mass * G * cfg.prop.D; // scale with hover torque authority
      torque[0] += tw * this.washTorque[0].update(dt);
      torque[1] += 0.4 * tw * this.washTorque[1].update(dt);
      torque[2] += tw * this.washTorque[2].update(dt);
    } else {
      for (const w of this.washTorque) w.x *= 0.99;
    }

    // --- body drag (quadratic, per-axis CdA, body frame) ---
    const vmag = vlen(vAirBody);
    if (vmag > 1e-4) {
      const A = cfg.aero.CdA;
      force[0] -= 0.5 * this.rho * A[0] * vmag * vAirBody[0];
      force[1] -= 0.5 * this.rho * A[1] * vmag * vAirBody[1];
      force[2] -= 0.5 * this.rho * A[2] * vmag * vAirBody[2];
    }

    // --- gyroscopic: w x (Iw + h_rotor) and spool reaction on yaw ---
    const Lx = this.I[0] * this.omega[0];
    const Ly = this.I[1] * this.omega[1] + hRotor;
    const Lz = this.I[2] * this.omega[2];
    torque[0] -= this.omega[1] * Lz - this.omega[2] * Ly;
    torque[1] -= this.omega[2] * Lx - this.omega[0] * Lz;
    torque[2] -= this.omega[0] * Ly - this.omega[1] * Lx;
    torque[1] -= hRotorDot;

    // Small rotational damping (frame drag against spin).
    const wmag = vlen(this.omega);
    vaddScaled(torque, torque, this.omega, -1.2e-5 * wmag - 2e-5);

    // --- integrate (semi-implicit Euler) ---
    this.omega[0] = clamp(this.omega[0] + torque[0] * this.invI[0] * dt, -100, 100);
    this.omega[1] = clamp(this.omega[1] + torque[1] * this.invI[1] * dt, -100, 100);
    this.omega[2] = clamp(this.omega[2] + torque[2] * this.invI[2] * dt, -100, 100);
    qintegrate(this.q, this.q, this.omega, dt);

    const forceWorld = qrotate(s[9], this.q, force);
    this.vel[0] += forceWorld[0] * this.invMass * dt;
    this.vel[1] += (forceWorld[1] * this.invMass - G) * dt;
    this.vel[2] += forceWorld[2] * this.invMass * dt;
    vaddScaled(this.pos, this.pos, this.vel, dt);

    // --- collisions ---
    for (let i = 0; i < 4; i++) {
      const p = this._contactPts[i];
      qrotate(p.rBody, this.q, this.motorPos[i]);
      vadd(p.world, this.pos, p.rBody);
    }
    const bodyPt = this._contactPts[4];
    vzero(bodyPt.rBody); vcopy(bodyPt.world, this.pos);

    const omegaWorld = qrotate(s[10], this.q, this.omega);
    const cstate = {
      pos: this.pos, vel: this.vel, omegaWorld,
      invMass: this.invMass, invInertiaWorld: this.invIavg,
    };
    const res = resolveCollisions(cstate, this._contactPts, this.colliders);
    this.contact = res.contact;
    this.lastImpact = res.maxImpact;
    if (res.contact) qrotateInv(this.omega, this.q, omegaWorld);

    // --- telemetry trace (every 5th step = 200 Hz) ---
    if (++this._traceCnt >= 5) {
      this._traceCnt = 0;
      this.trace.push({
        t: this.time,
        sp: this.fc.spDps.slice(),
        gyro: this.fc.gyroDps.slice(),
        thr: this.inputs.throttle,
      });
      if (this.trace.length > this.traceMax) this.trace.shift();
    }
  }

  // Convenience readouts for HUD/audio.
  get speed() { return vlen(this.vel); }
  get altitude() { return this.pos[1]; }
  get totalThrust() { return this.motors.reduce((a, m) => a + m.thrust, 0); }
  get avgRpm() { return this.motors.reduce((a, m) => a + m.rpm, 0) / 4; }
}
