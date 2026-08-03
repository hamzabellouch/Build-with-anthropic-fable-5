// Flight controller emulation, modeled on Betaflight 4.x behavior:
//  - "Actual" rates curve (same formula as Betaflight rc.c)
//  - rate-mode PID per body axis with feedforward, D-term low-pass,
//    I-term clamp and saturation-aware anti-windup
//  - airmode mixer: full PID authority at zero throttle, differential
//    preserved when motors saturate (Betaflight mixer scaling)
//  - angle mode (self-level) as an outer loop feeding rate setpoints
//
// Pilot stick convention used throughout the sim, all in [-1, 1]:
//   roll  +1 = stick right  = roll right
//   pitch +1 = stick back   = nose up
//   yaw   +1 = stick right  = nose right
//   throttle in [0, 1]
//
// Body frame: +X right, +Y up, +Z back. So:
//   nose up    = +wx   -> pitch axis = +X
//   nose right = -wy   -> yaw axis   = -Y
//   roll right = -wz   -> roll axis  = -Z

import { DEG, PT1, PT2, clamp } from './math.js';

// Betaflight "Actual" rates: deg/s from stick position.
export function actualRates(x, { centerDps, maxDps, expo }) {
  const ax = Math.abs(x);
  const curved = ax * (Math.pow(x, 5) * expo + x * (1 - expo));
  return x * centerDps + Math.max(0, maxDps - centerDps) * curved;
}

class AxisPID {
  constructor(g, dtermCutoffHz, dt) {
    this.g = g;
    this.i = 0;
    this.prevGyro = 0;
    this.prevSp = 0;
    this.dFilt = new PT2(dtermCutoffHz, dt);
    this.ffFilt = new PT1(35, dt);
    this.p = 0; this.d = 0; this.ff = 0;
  }
  reset() { this.i = 0; this.prevGyro = 0; this.prevSp = 0; this.dFilt.set(0); this.ffFilt.set(0); }
  update(sp, gyro, dt, saturated) {
    const e = sp - gyro;
    this.p = this.g.P * e;
    if (!saturated) this.i = clamp(this.i + this.g.I * e * dt, -this.iLimit, this.iLimit);
    const dRaw = -(gyro - this.prevGyro) / dt;          // derivative on measurement
    this.prevGyro = gyro;
    this.d = this.g.D * this.dFilt.update(dRaw);
    const spRate = (sp - this.prevSp) / dt;
    this.prevSp = sp;
    this.ff = this.g.FF * this.ffFilt.update(spRate);
    return this.p + this.i + this.d + this.ff;
  }
}

export class FlightController {
  constructor(cfg, dt) {
    this.cfg = cfg;
    this.dt = dt;
    this.armed = false;
    this.angleMode = false;
    this.airmode = true;

    const fc = cfg.fc;
    this.pidRoll = new AxisPID(fc.pid.rollPitch, fc.dtermCutoffHz, dt);
    this.pidPitch = new AxisPID(fc.pid.rollPitch, fc.dtermCutoffHz, dt);
    this.pidYaw = new AxisPID(fc.pid.yaw, fc.dtermCutoffHz, dt);
    for (const p of [this.pidRoll, this.pidPitch, this.pidYaw]) p.iLimit = fc.itermLimit;

    this.spFiltR = new PT2(fc.setpointCutoffHz, dt);
    this.spFiltP = new PT2(fc.setpointCutoffHz, dt);
    this.spFiltY = new PT2(fc.setpointCutoffHz, dt);
    this.gyroFiltX = new PT1(fc.gyroCutoffHz, dt);
    this.gyroFiltY = new PT1(fc.gyroCutoffHz, dt);
    this.gyroFiltZ = new PT1(fc.gyroCutoffHz, dt);

    // Output delay line models loop + ESC + filter group delay.
    this.delaySteps = Math.max(0, Math.round(fc.outputDelaySec / dt));
    this.delayBuf = [];
    this.motors = [0, 0, 0, 0];
    this.saturated = false;

    // Telemetry for HUD graphs (deg/s).
    this.spDps = [0, 0, 0];
    this.gyroDps = [0, 0, 0];

    // Mixer table per motor [roll, pitch, yaw] in pilot sign convention.
    // Derived in presets.js comment; matches Betaflight quad-X.
    this.mix = cfg.motors.map(m => [
      -Math.sign(m.pos[0]),   // roll right -> left motors up
      -Math.sign(m.pos[2]),   // nose up    -> front motors up
      m.spin,                 // nose right -> speed up CCW props (body reaction torque is -spin)
    ]);
  }

  arm() {
    this.armed = true;
    for (const p of [this.pidRoll, this.pidPitch, this.pidYaw]) p.reset();
  }
  disarm() { this.armed = false; this.motors = [0, 0, 0, 0]; this.delayBuf.length = 0; }

  // inputs: pilot sticks; gyroBody: angular velocity in body frame rad/s;
  // att: {pitch, roll} Euler-ish tilt angles (rad) for angle mode.
  update(inputs, gyroBody, att, dt) {
    if (!this.armed) { this.motors = [0, 0, 0, 0]; return this.motors; }
    const fc = this.cfg.fc;

    // --- setpoints (pilot frame, rad/s) ---
    let rollSp, pitchSp;
    if (this.angleMode) {
      const maxA = fc.angle.maxDeg * DEG;
      rollSp = fc.angle.Kp * (inputs.roll * maxA - att.roll);
      pitchSp = fc.angle.Kp * (inputs.pitch * maxA - att.pitch);
    } else {
      rollSp = actualRates(inputs.roll, fc.rates) * DEG;
      pitchSp = actualRates(inputs.pitch, fc.rates) * DEG;
    }
    const yawSp = actualRates(inputs.yaw, fc.ratesYaw) * DEG;

    const rSp = this.spFiltR.update(rollSp);
    const pSp = this.spFiltP.update(pitchSp);
    const ySp = this.spFiltY.update(yawSp);

    // --- gyro (pilot frame) ---
    const gx = this.gyroFiltX.update(gyroBody[0]);   // +nose up
    const gy = this.gyroFiltY.update(gyroBody[1]);
    const gz = this.gyroFiltZ.update(gyroBody[2]);
    const gRoll = -gz, gPitch = gx, gYaw = -gy;

    this.spDps = [rSp / DEG, pSp / DEG, ySp / DEG];
    this.gyroDps = [gRoll / DEG, gPitch / DEG, gYaw / DEG];

    const sat = this.saturated;
    const rollOut = this.pidRoll.update(rSp, gRoll, dt, sat);
    const pitchOut = this.pidPitch.update(pSp, gPitch, dt, sat);
    const yawOut = clamp(this.pidYaw.update(ySp, gYaw, dt, sat), -0.5, 0.5);

    // --- mixer with airmode ---
    const t = clamp(inputs.throttle, 0, 1);
    const pidMix = this.mix.map(m => m[0] * rollOut + m[1] * pitchOut + m[2] * yawOut);
    let lo = Math.min(...pidMix), hi = Math.max(...pidMix);
    const range = hi - lo;
    let scale = 1;
    if (range > 1) { scale = 1 / range; lo *= scale; hi *= scale; }
    // Shift throttle so the differential always fits inside [idle, 1].
    const tAdj = clamp(t, fc.idle - lo, 1 - hi);
    // I-term anti-windup only when the differential itself no longer fits
    // (airmode preserves authority in every other case).
    this.saturated = range > 1;

    const out = [0, 0, 0, 0];
    for (let i = 0; i < 4; i++) out[i] = clamp(tAdj + pidMix[i] * scale, fc.idle, 1);

    // --- output delay ---
    if (this.delaySteps > 0) {
      this.delayBuf.push(out);
      this.motors = this.delayBuf.length > this.delaySteps ? this.delayBuf.shift() : [fc.idle, fc.idle, fc.idle, fc.idle];
    } else {
      this.motors = out;
    }
    return this.motors;
  }
}
