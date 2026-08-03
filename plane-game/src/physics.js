// ============================================================================
// 6-DOF rigid-body flight dynamics engine.
//
// Conventions
//   World frame: +Y up, right-handed. North = -Z, East = +X.
//   Body frame (three.js object space): +X right wing, +Y up, -Z nose.
//   omega: angular velocity in BODY axes (three.js):
//       +omega.x = pitch nose-up, +omega.y = yaw nose-LEFT, +omega.z = roll LEFT.
//   Standard flight-dynamics rates: p (roll right), q (pitch up), r (yaw right)
//       p = -omega.z, q = omega.x, r = -omega.y
//
// Forces modelled: lift (with post-stall flat-plate blend), parasitic + induced
// + flap + gear + compressibility drag, sideforce, thrust (momentum-theory prop
// or spooled turbofan), weight, per-wheel spring/damper gear with tyre friction.
// Moments: static stability, control surfaces, rate damping, dihedral effect,
// adverse yaw, prop torque & P-factor, ground effect, turbulence, stall buffet.
// Atmosphere: ISA troposphere. Integrator: semi-implicit Euler @ 240 Hz.
// ============================================================================

import * as THREE from 'three';
import { clamp, sat, softSat, lerp, damp, valueNoise2, DEG2RAD, MS2KT } from './util.js';

export const G0 = 9.80665;
export const RHO0 = 1.225;

// --- ISA troposphere -------------------------------------------------------
export function isa(h) {
  const hc = clamp(h, -400, 11000);
  const T = 288.15 - 0.0065 * hc;
  const p = 101325 * Math.pow(T / 288.15, 5.2561);
  const rho = p / (287.053 * T);
  const a = Math.sqrt(1.4 * 287.053 * T); // speed of sound
  return { T, p, rho, a };
}

// --- Wind & turbulence ------------------------------------------------------
export class Wind {
  constructor(setting = 1) {
    this.set(setting);
    this._v = new THREE.Vector3();
  }
  set(setting) {
    this.setting = setting;
    const speeds = [0, 3.5, 7, 12];       // m/s mean
    const gusts = [0, 0.6, 2.2, 4.5];     // m/s gust amplitude
    const dirs = [0, 250, 230, 210];      // wind FROM, deg true
    this.mean = speeds[setting] || 0;
    this.gust = gusts[setting] || 0;
    this.dirFrom = (dirs[setting] || 0) * DEG2RAD;
    this.turb = [0, 0.15, 0.5, 1.0][setting] || 0;
  }
  // Wind vector (direction air moves toward) at position/time.
  vectorAt(pos, t, out) {
    const o = out || this._v;
    if (this.mean === 0 && this.gust === 0) return o.set(0, 0, 0);
    const g1 = Math.sin(t * 0.31) * 0.6 + Math.sin(t * 0.77 + 1.7) * 0.3 + Math.sin(t * 1.93 + 4.0) * 0.1;
    const g2 = Math.sin(t * 0.23 + 2.0) * 0.5 + Math.sin(t * 1.13 + 0.5) * 0.5;
    const spd = this.mean + this.gust * g1;
    const dir = this.dirFrom + 0.10 * this.turb * g2;
    // FROM dir; air moves toward dir+180. North = -Z, East = +X.
    o.set(-Math.sin(dir), 0, Math.cos(dir)).multiplyScalar(spd);
    o.y = this.gust * 0.35 * Math.sin(t * 0.9 + pos.x * 0.001 + pos.z * 0.0013);
    return o;
  }
}

// --- module scratch vectors (single-threaded; reused to avoid GC) -----------
const UP = new THREE.Vector3(0, 1, 0);
const _f = new THREE.Vector3(), _u = new THREE.Vector3(), _r = new THREE.Vector3();
const _va = new THREE.Vector3(), _vaDir = new THREE.Vector3();
const _t1 = new THREE.Vector3(), _t2 = new THREE.Vector3(), _t3 = new THREE.Vector3(), _t4 = new THREE.Vector3();
const _force = new THREE.Vector3(), _moment = new THREE.Vector3();
const _wpos = new THREE.Vector3(), _wvel = new THREE.Vector3(), _fr = new THREE.Vector3(), _tq = new THREE.Vector3();
const _dq = new THREE.Quaternion(), _qi = new THREE.Quaternion();
const _wind = new THREE.Vector3();

const SUBSTEP = 1 / 240;

export class FlightModel {
  /**
   * @param {object} af airframe definition (see airframes.js)
   * @param {(x:number,z:number)=>{h:number,surface:string}} terrainInfo
   * @param {Wind} wind
   */
  constructor(af, terrainInfo, wind) {
    this.af = af;
    this.terrainInfo = terrainInfo;
    this.wind = wind || new Wind(0);

    this.pos = new THREE.Vector3();
    this.vel = new THREE.Vector3();
    this.quat = new THREE.Quaternion();
    this.omega = new THREE.Vector3();

    this.inputs = {
      pitch: 0, roll: 0, yaw: 0,        // -1..1
      throttle: 0,                       // 0..1
      afterburner: false,
      flapIdx: 0,
      gearDown: true,
      brake: 0,                          // 0..1
      parking: true,
      trim: 0,                           // -1..1
      assist: false,
    };

    this.powerFrac = 0;
    this.rpm = 0;
    this.gearPos = 1;
    this.flapDeg = 0;
    this.alphaPrev = 0;
    this.alphaDotF = 0;
    this.fbwInt = 0;
    this.time = 0;
    this.overGTimer = 0;

    this.crashed = false;
    this.crashReason = '';

    // inertia mapped to three.js body axes: X=pitch, Y=yaw, Z=roll
    this.Ix = af.inertia.pitch;
    this.Iy = af.inertia.yaw;
    this.Iz = af.inertia.roll;
    this.AR = (af.b * af.b) / af.S;

    if (af.engine.type === 'piston') {
      const A = Math.PI * (af.engine.propDiam / 2) ** 2;
      const Pe = af.engine.power * 0.85;
      this.staticThrust = Math.cbrt(2 * RHO0 * A * Pe * Pe);
      this.vT = (af.engine.propEff * af.engine.power) / this.staticThrust;
    }

    // airframe contact points (scrape springs + fatality rules)
    const L = af.length, b = af.b, ch = af.gear.cgHeight;
    this.crashPoints = [
      { p: new THREE.Vector3(0, -0.30 * ch, -0.46 * L), what: 'nose', type: 'nose', wasContact: false },
      { p: new THREE.Vector3(0, -0.12 * ch, 0.47 * L), what: 'tail', type: 'skid', wasContact: false },
      { p: new THREE.Vector3(-0.5 * b, 0.05, 0), what: 'left wingtip', type: 'tip', wasContact: false },
      { p: new THREE.Vector3(0.5 * b, 0.05, 0), what: 'right wingtip', type: 'tip', wasContact: false },
      { p: new THREE.Vector3(0, -0.62 * ch, -0.12 * L), what: 'fuselage', type: 'belly', wasContact: false },
    ];

    this.wheels = af.gear.wheels.map((w) => {
      const mShare = af.mass * w.share;
      const k = (mShare * G0) / 0.13;             // ~13 cm static compression
      const c = 2 * 0.85 * Math.sqrt(k * mShare);
      return {
        def: w, k, c,
        pos: new THREE.Vector3(w.pos[0], w.pos[1], w.pos[2]),
        compression: 0, prevComp: 0, contactVy: 0,
      };
    });

    this.out = {
      ias: 0, tas: 0, gs: 0, mach: 0, alt: 0, agl: 0, vs: 0,
      alpha: 0, beta: 0, G: 1, heading: 0, pitch: 0, roll: 0,
      rpm: 0, thrust: 0, onGround: true, onRunway: true, stalled: false,
      buffet: 0, aoaFrac: 0, wheelSpeed: 0, windKt: 0, windDir: 0,
      overspeed: false, gearTransit: false, powerFrac: 0, flapDeg: 0, gearPos: 1,
      ctrl: { elev: 0, ail: 0, rud: 0 },
    };
  }

  // Place on the ground at (x,z) with heading (rad, 0 = north), at rest.
  reset(x, z, headingRad) {
    const ti = this.terrainInfo(x, z);
    const af = this.af;
    this.quat.setFromAxisAngle(UP, -headingRad);
    // spawn with the suspension at its ~13 cm static compression so the
    // aircraft starts settled rather than dropping onto its gear
    if (af.gear.type === 'taildragger') {
      const mw = af.gear.wheels[0], tw = af.gear.wheels[2];
      const restPitch = Math.atan2(-(mw.pos[1] - tw.pos[1]), tw.pos[2] - mw.pos[2]);
      _dq.setFromAxisAngle(_t1.set(1, 0, 0), restPitch);
      this.quat.multiply(_dq);
      this.pos.set(x, ti.h + af.gear.cgHeight * Math.cos(restPitch) - 0.115, z);
    } else {
      this.pos.set(x, ti.h + af.gear.cgHeight - 0.115, z);
    }
    this.vel.set(0, 0, 0);
    this.omega.set(0, 0, 0);
    this.powerFrac = 0;
    this.rpm = af.engine.type === 'piston' ? af.engine.rpmIdle : 0;
    this.gearPos = 1;
    this.flapDeg = 0;
    this.alphaPrev = 0; this.alphaDotF = 0; this.fbwInt = 0;
    this.overGTimer = 0;
    this.crashed = false;
    this.crashReason = '';
    const i = this.inputs;
    i.pitch = i.roll = i.yaw = 0; i.throttle = 0; i.afterburner = false;
    i.flapIdx = 0; i.gearDown = true; i.brake = 0; i.parking = true; i.trim = 0;
    for (const w of this.wheels) { w.compression = 0; w.prevComp = 0; }
    for (const cp of this.crashPoints) cp.wasContact = false;
  }

  step(dt) {
    if (this.crashed) return;
    let remaining = Math.min(dt, 0.25);
    while (remaining > 1e-6 && !this.crashed) {
      const h = Math.min(SUBSTEP, remaining);
      this.substep(h);
      remaining -= h;
    }
  }

  substep(h) {
    const af = this.af, inp = this.inputs, out = this.out;
    this.time += h;

    // --- frames & air data --------------------------------------------------
    _f.set(0, 0, -1).applyQuaternion(this.quat);   // forward
    _u.set(0, 1, 0).applyQuaternion(this.quat);    // up
    _r.set(1, 0, 0).applyQuaternion(this.quat);    // right

    const air = isa(this.pos.y);
    const rho = air.rho;

    this.wind.vectorAt(this.pos, this.time, _wind);
    _va.copy(this.vel).sub(_wind);
    const V = _va.length();
    const Vsafe = Math.max(V, 0.5);
    _vaDir.copy(_va).multiplyScalar(1 / Vsafe);

    const uFwd = _va.dot(_f);
    const wUp = _va.dot(_u);
    const vSide = _va.dot(_r);
    const alpha = V > 4 ? Math.atan2(-wUp, Math.max(uFwd, 0.4)) : 0;
    const beta = V > 4 ? Math.asin(clamp(vSide / Vsafe, -1, 1)) : 0;

    const aDot = (alpha - this.alphaPrev) / h;
    this.alphaPrev = alpha;
    this.alphaDotF = damp(this.alphaDotF, clamp(aDot, -6, 6), 12, h);

    const qbar = 0.5 * rho * V * V;
    const mach = V / air.a;
    const p = -this.omega.z, q = this.omega.x, rr = -this.omega.y; // std rates

    // --- engine -------------------------------------------------------------
    let thrust = 0, engTorque = 0;
    if (af.engine.type === 'piston') {
      this.powerFrac = damp(this.powerFrac, inp.throttle, 2.5, h);
      let altFac = rho / RHO0;
      if (af.id === 'p51') altFac = Math.max(altFac, Math.min(1, rho / isa(7300).rho));
      const power = Math.max(this.powerFrac, 0.045) * af.engine.power * altFac;
      const denom = Math.max(V + this.vT * Math.exp(-V / this.vT), 2);
      thrust = (af.engine.propEff * power) / denom;
      if (inp.throttle < 0.05 && V > 20) thrust -= 0.012 * qbar * af.S; // windmilling drag
      this.rpm = damp(this.rpm, af.engine.rpmIdle + (af.engine.rpmMax - af.engine.rpmIdle) * this.powerFrac, 3, h);
      const omegaProp = Math.max(this.rpm, 300) * 0.10472;
      engTorque = (power / omegaProp) * af.engine.torqueFactor; // rolls LEFT (+omega.z)
    } else {
      const targetFrac = inp.throttle * (inp.afterburner ? 1.65 : 1.0);
      this.powerFrac = damp(this.powerFrac, targetFrac, af.engine.spoolRate, h);
      const ram = 1 + af.engine.ramK * mach;
      thrust = Math.max(this.powerFrac, 0.02) * af.engine.thrust * ram * Math.pow(rho / RHO0, 0.72);
      this.rpm = 4000 + 8000 * clamp(this.powerFrac / 1.65, 0, 1);
    }

    // --- actuators (gear, flaps) ---------------------------------------------
    if (af.gear.retractable) {
      const tgt = inp.gearDown ? 1 : 0;
      this.gearPos = clamp(this.gearPos + Math.sign(tgt - this.gearPos) * (h / 3.2), 0, 1);
    } else this.gearPos = 1;
    this.flapDeg = damp(this.flapDeg, af.flapNotches[inp.flapIdx] || 0, 1.2, h);

    // --- control laws: trim, beginner assist, F-16 FBW ------------------------
    let pitchCmd = sat(inp.pitch + inp.trim * af.trimAuthority);
    let rollCmd = sat(inp.roll);
    let yawCmd = sat(inp.yaw);

    if (af.fbw) {
      const f = af.fbw;
      const qCmdMaxG = ((af.gLimitPos - 0.2) * G0) / Math.max(V, 60); // G-limit as pitch-rate cap
      let qCmd = inp.pitch * Math.min(f.pitchRateMax, qCmdMaxG) + inp.trim * 0.06;
      // neutral stick seeks 1 G (real F-16 pitch CAS is a G-command system)
      const stickAuth = 1 - Math.min(Math.abs(inp.pitch) * 2.5, 1);
      if (!out.onGround) qCmd += (1 - out.G) * 0.085 * stickAuth;
      const aMargin = f.aoaLimit - alpha;
      if (aMargin < 3 * DEG2RAD && qCmd > 0) qCmd = Math.min(qCmd, aMargin * 2.2); // AoA limiter
      const qErr = qCmd - q;
      this.fbwInt = clamp(this.fbwInt + qErr * f.kqI * h, -0.7, 0.7);
      if (out.onGround) this.fbwInt = damp(this.fbwInt, 0, 4, h);
      pitchCmd = sat(qErr * f.kqP * 0.2 + this.fbwInt + inp.pitch * 0.15);
      rollCmd = sat((inp.roll * f.rollRateMax - p) * f.kpP);
      yawCmd = sat(inp.yaw - f.yawDamp * rr * 0.5 + beta * 2.5);
    } else if (inp.assist) {
      pitchCmd = sat(pitchCmd - q * 0.9);
      rollCmd = sat(rollCmd - p * 0.55);
      yawCmd = sat(yawCmd + rollCmd * 0.18 - rr * 0.7 + beta * 1.8);
      const aMargin = af.aStall - 2 * DEG2RAD - alpha;
      if (aMargin < 0 && pitchCmd > 0) pitchCmd = Math.max(0, pitchCmd + aMargin * 8);
    }

    out.ctrl.elev = pitchCmd; out.ctrl.ail = rollCmd; out.ctrl.rud = yawCmd;

    // --- aerodynamic coefficients ----------------------------------------------
    const flapCL = this.flapDeg * af.flapCL;
    const aStall = af.aStall + this.flapDeg * af.flapAStallShift;
    // Beard–McLain sigmoid blend: linear CL -> flat-plate beyond the stall
    const M = af.stallSharp;
    const eN = Math.exp(clamp(-M * (alpha - aStall), -30, 30));
    const eP = Math.exp(clamp(M * (alpha + aStall), -30, 30));
    const sigma = (1 + eN + eP) / ((1 + eN) * (1 + eP));
    const CLlin = af.CL0 + af.CLa * alpha + flapCL;
    const CLflat = 2 * Math.sign(alpha) * Math.sin(alpha) ** 2 * Math.cos(alpha);
    const CL = (1 - sigma) * CLlin + sigma * CLflat;

    // ground effect (reduces induced drag near the surface)
    const agl = this.pos.y - this.terrainInfo(this.pos.x, this.pos.z).h;
    const hb = Math.max(agl, 0.1) / af.b;
    const ge = (16 * hb * hb) / (1 + 16 * hb * hb); // 0 at ground -> 1 aloft

    let CD = af.CD0
      + ((CL * CL) / (Math.PI * af.e * this.AR)) * lerp(0.55, 1, ge)
      + this.flapDeg * af.flapCD
      + (af.gear.retractable ? this.gearPos * af.gear.cd : 0)
      + 1.2 * beta * beta
      + sigma * 0.9 * Math.abs(Math.sin(alpha)) ** 3;
    if (af.machCrit) {
      const dM = Math.max(0, mach - af.machCrit);
      CD += Math.min(0.042, (af.machDragK || 9) * dM * dM * dM);
    }

    const CY = af.CYb * beta + 0.35 * yawCmd * af.maxDef.rud;

    // --- forces ------------------------------------------------------------------
    _force.set(0, -af.mass * G0, 0);
    _force.addScaledVector(_f, thrust);

    if (V > 0.8) {
      const L = qbar * af.S * CL;
      const D = qbar * af.S * CD;
      const Y = qbar * af.S * CY;
      _t1.crossVectors(_r, _vaDir).normalize();                        // lift dir
      _force.addScaledVector(_t1, L);
      _force.addScaledVector(_vaDir, -D);
      _t2.copy(_r).addScaledVector(_vaDir, -_r.dot(_vaDir)).normalize(); // side dir
      _force.addScaledVector(_t2, Y);
    }

    // --- moments (three.js body axes) ---------------------------------------------
    const qbarCtl = qbar + (af.engine.type === 'piston' ? (0.55 * Math.max(thrust, 0)) / af.S : 0);
    const Vd = Math.max(V, 12);
    const cq = af.c / (2 * Vd), bq = af.b / (2 * Vd);

    // control coefficients are per-radian of surface deflection
    const dElev = pitchCmd * af.maxDef.elev;
    const dAil = rollCmd * af.maxDef.ail;
    const dRud = yawCmd * af.maxDef.rud;
    const Cm = af.Cm0 + af.Cma * alpha + af.Cmq * q * cq
      + (af.Cmadot || 0) * this.alphaDotF * cq + this.flapDeg * af.flapCm;
    const CmCtl = af.Cmde * dElev;
    const Cl = af.Clb * beta + af.Clp * p * bq + af.Clr * rr * bq + af.Clda * dAil;
    const Cn = af.Cnb * beta + af.Cnr * rr * bq + af.Cnda * dAil;
    const CnCtl = af.Cndr * dRud;

    // stall buffet & asymmetric wing drop
    let buffet = 0, buffetMx = 0, dropCl = 0;
    if (sigma > 0.12 && V > 15) {
      buffet = sigma * Math.min(qbar / 3000, 1);
      const t = this.time;
      buffetMx = buffet * (Math.sin(t * 47) + Math.sin(t * 91 + 1)) * 0.012 * qbar * af.S * af.c;
      dropCl = sigma * 0.030 * (valueNoise2(t * 0.45, 13.7) - 0.5);
    }

    _moment.set(
      qbar * af.S * af.c * Cm + qbarCtl * af.S * af.c * CmCtl + buffetMx,
      -(qbar * af.S * af.b * Cn + qbarCtl * af.S * af.b * CnCtl),   // +Cn (nose right) = -omega.y
      -(qbar * af.S * af.b * (Cl + dropCl)),                        // +Cl (roll right) = -omega.z
    );

    // prop torque rolls LEFT; P-factor / slipstream yaws LEFT at power + low speed
    if (af.engine.type === 'piston') {
      // torque & P-factor dominate at high power / low airspeed; at cruise the
      // aircraft is rigged/trimmed to fly straight, so taper them out with V
      const lowSpd = Math.max(0, 1 - V / 52);
      _moment.z += engTorque * lowSpd;
      _moment.y += af.engine.pFactor * Math.max(thrust, 0) * af.b * lowSpd; // +y = nose left
    }

    // turbulence torques
    if (this.wind.turb > 0 && V > 10) {
      const t = this.time, ti = this.wind.turb;
      _moment.x += ti * (valueNoise2(t * 1.8, 3.1) - 0.5) * 0.030 * qbar * af.S * af.c;
      _moment.z += ti * (valueNoise2(t * 2.2, 9.4) - 0.5) * 0.015 * qbar * af.S * af.b;
      _moment.y += ti * (valueNoise2(t * 1.4, 6.2) - 0.5) * 0.006 * qbar * af.S * af.b;
    }

    // --- landing gear ----------------------------------------------------------------
    let onGround = false, onRunway = false, wheelSpeed = 0;
    if (this.gearPos > 0.95) {
      for (const w of this.wheels) {
        w.prevComp = w.compression;
        _wpos.copy(w.pos).applyQuaternion(this.quat).add(this.pos);
        const ti = this.terrainInfo(_wpos.x, _wpos.z);
        const pen = ti.h - _wpos.y;
        if (pen <= 0) { w.compression = 0; continue; }
        if (ti.surface === 'water') { this.crash('Ditched in the water'); return; }
        onGround = true;
        if (ti.surface === 'runway') onRunway = true;
        w.compression = pen;

        _t1.copy(w.pos).applyQuaternion(this.quat);               // r (world)
        this.worldOmega(_t3);
        _wvel.crossVectors(_t3, _t1).add(this.vel);               // contact-point velocity
        w.contactVy = _wvel.y;
        if (w.prevComp <= 0 && _wvel.y < -5.2) { this.crash('Landing gear collapsed — touchdown too hard'); return; }

        let N = w.k * pen - w.c * _wvel.y;
        N = clamp(N, 0, af.mass * G0 * 6);
        _force.y += N;
        _t2.set(0, N, 0);
        this.addWorldTorqueAt(_t1, _t2);

        // tyre friction
        const isGrass = ti.surface !== 'runway';
        let steer = 0;
        if (w.def.steer) {
          const steerSign = w.pos.z > 0 ? -1 : 1;                 // tailwheel steers opposite
          const authority = 1 / (1 + (V / 9) ** 2);
          steer = steerSign * inp.yaw * w.def.steer * authority;
        }
        _t3.copy(_f).applyAxisAngle(_u, -steer);                  // wheel rolling dir
        _t3.y = 0;
        if (_t3.lengthSq() > 1e-6) _t3.normalize(); else _t3.set(0, 0, -1);
        _t4.crossVectors(_t3, UP).multiplyScalar(-1).normalize(); // wheel right dir (horizontal)
        const vLon = _wvel.dot(_t3);
        const vLat = _wvel.dot(_t4);
        wheelSpeed = Math.max(wheelSpeed, Math.abs(vLon));
        const muSide = isGrass ? 0.55 : 0.82;
        let muRoll = isGrass ? 0.055 : 0.012;
        const brk = w.def.brake * Math.max(inp.brake, inp.parking ? 1 : 0);
        muRoll += brk * (isGrass ? 0.30 : 0.52);
        let fLat = -muSide * N * softSat(vLat / 0.22);
        let fLon = -muRoll * N * softSat(vLon / 0.35);
        const fMax = 0.9 * N;
        const fMag = Math.hypot(fLat, fLon);
        if (fMag > fMax) { fLat *= fMax / fMag; fLon *= fMax / fMag; }
        _fr.set(0, 0, 0).addScaledVector(_t3, fLon).addScaledVector(_t4, fLat);
        _force.add(_fr);
        // apply friction torque from a reduced arm: the un-modelled tyre/strut
        // compliance would otherwise make tip-over moments too violent
        _t1.multiplyScalar(0.6);
        this.addWorldTorqueAt(_t1, _fr);
      }
    }

    // --- airframe scrape contacts (nose, tail skid, wingtips, belly) ---------------
    // Non-wheel contact applies a stiff spring + friction (a scrape) unless the
    // impact exceeds the point's fatality rule.
    let scrape = false;
    {
      const spd = this.vel.length();
      for (const cp of this.crashPoints) {
        _wpos.copy(cp.p).applyQuaternion(this.quat).add(this.pos);
        const ti = this.terrainInfo(_wpos.x, _wpos.z);
        const pen = ti.h - _wpos.y;
        if (pen <= 0) { cp.wasContact = false; continue; }
        if (ti.surface === 'water') { this.crash('Ditched in the water'); return; }
        _t1.copy(cp.p).applyQuaternion(this.quat);
        this.worldOmega(_t3);
        _wvel.crossVectors(_t3, _t1).add(this.vel);
        const vyP = _wvel.y;
        const first = !cp.wasContact;
        cp.wasContact = true;
        if (cp.type === 'nose' && (spd > 8 || vyP < -1.2)) {
          this.crash(`Nose and propeller struck the ground at ${Math.round(spd * MS2KT)} kt`); return;
        }
        if (cp.type === 'belly' && spd > 8) {
          this.crash(this.gearPos < 0.5 ? 'Belly contact — landing gear was retracted' : 'Fuselage struck the ground'); return;
        }
        if (cp.type === 'skid' && first && vyP < -3.6 && spd > 6) { this.crash('Tail slammed into the runway'); return; }
        if (cp.type === 'tip' && (spd > 26 || (first && vyP < -3.0 && spd > 6))) {
          this.crash(`${cp.what === 'left wingtip' ? 'Left' : 'Right'} wingtip dug into the ground`); return;
        }
        scrape = true;
        let N = af.mass * (14 * pen + (vyP < 0 ? 1.6 * -vyP : 0));
        N = clamp(N, 0, af.mass * G0 * 0.55);
        _t2.set(0, N, 0);
        _force.y += N;
        this.addWorldTorqueAt(_t1, _t2);
        const vh = Math.hypot(_wvel.x, _wvel.z);
        if (vh > 0.1) {
          const k = (0.45 * N) / vh;
          _fr.set(-_wvel.x * k, 0, -_wvel.z * k);
          _force.add(_fr);
          this.addWorldTorqueAt(_t1, _fr);
        }
      }
    }

    // --- integrate ----------------------------------------------------------------
    // Euler: I w' = M - w x (I w)  =>  w'_x = (Mx + (Iy - Iz) wy wz)/Ix, etc.
    const w = this.omega;
    w.x += ((_moment.x + (this.Iy - this.Iz) * w.y * w.z) / this.Ix) * h;
    w.y += ((_moment.y + (this.Iz - this.Ix) * w.z * w.x) / this.Iy) * h;
    w.z += ((_moment.z + (this.Ix - this.Iy) * w.x * w.y) / this.Iz) * h;
    if (onGround) {
      const k = Math.exp(-2.2 * h);
      w.x *= k; w.y *= Math.exp(-1.2 * h); w.z *= k;
    }
    const wMag = w.length();
    if (wMag > 9) w.multiplyScalar(9 / wMag);

    this.vel.x += (_force.x / af.mass) * h;
    this.vel.y += (_force.y / af.mass) * h;
    this.vel.z += (_force.z / af.mass) * h;
    this.pos.addScaledVector(this.vel, h);

    if (wMag > 1e-9) {
      _t1.copy(w).multiplyScalar(1 / wMag);
      _dq.setFromAxisAngle(_t1, wMag * h);
      this.quat.multiply(_dq).normalize();
    }

    // pilot G: non-gravitational specific force along body up
    _t1.set(_force.x, _force.y + af.mass * G0, _force.z);
    const Gload = _t1.dot(_u) / (af.mass * G0);

    // --- structural limits -------------------------------------------------------------
    if (Gload > af.gLimitPos * 1.5 || Gload < af.gLimitNeg * 1.6) {
      this.overGTimer += h;
      if (this.overGTimer > 0.35) { this.crash(`Airframe overstressed (${Gload.toFixed(1)} G)`); return; }
    } else this.overGTimer = Math.max(0, this.overGTimer - h * 2);
    if (V > af.vne * 1.22) { this.crash('Structural failure — exceeded never-exceed speed'); return; }

    // --- outputs -----------------------------------------------------------------------
    out.tas = V;
    out.ias = V * Math.sqrt(rho / RHO0);
    out.gs = Math.hypot(this.vel.x, this.vel.z);
    out.mach = mach;
    out.alt = this.pos.y;
    out.agl = agl;
    out.vs = this.vel.y;
    out.alpha = alpha;
    out.beta = beta;
    out.G = Gload;
    out.heading = Math.atan2(_f.x, -_f.z);
    out.pitch = Math.asin(clamp(_f.y, -1, 1));
    out.roll = -Math.atan2(_r.y, _u.y);
    out.rpm = this.rpm;
    out.thrust = thrust;
    out.onGround = onGround;
    out.onRunway = onRunway;
    out.scrape = scrape;
    out.stalled = sigma > 0.45 && !onGround && V > 8;
    out.buffet = buffet;
    out.aoaFrac = clamp(alpha / aStall, -1.5, 1.5);
    out.wheelSpeed = wheelSpeed;
    out.overspeed = V > af.vne;
    out.gearTransit = this.gearPos > 0.02 && this.gearPos < 0.98;
    out.windKt = this.wind.mean * MS2KT;
    out.windDir = this.wind.dirFrom;
    out.powerFrac = this.powerFrac;
    out.flapDeg = this.flapDeg;
    out.gearPos = this.gearPos;
  }

  worldOmega(out) {
    return out.copy(this.omega).applyQuaternion(this.quat);
  }

  // accumulate body-frame torque from world force fWorld applied at world offset rWorld
  addWorldTorqueAt(rWorld, fWorld) {
    _tq.crossVectors(rWorld, fWorld);
    _qi.copy(this.quat).invert();
    _tq.applyQuaternion(_qi);
    _moment.add(_tq);
  }

  crash(reason) {
    this.crashed = true;
    this.crashReason = reason;
  }
}
