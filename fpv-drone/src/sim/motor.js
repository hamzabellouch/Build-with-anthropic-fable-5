// Brushless motor + propeller + LiPo battery models.
//
// Motor: DC-equivalent model. ESC applies V = u * Vpack (average-value PWM).
//   I = (V - Ke*w) / R,   shaft torque = Kt*I - friction(w)
//   Jr * dw/dt = shaft torque - aero torque(w, inflow)
// This reproduces real spool-up lag (~15-25 ms time constant on a 5"),
// battery-sag-limited top RPM, and braking (DShot damped mode) naturally.
//
// Propeller: momentum-theory style coefficients with advance-ratio washout:
//   n = w / 2pi  [rev/s],  J = vAxial / (n*D)
//   T = Ct(J) * rho * n^2 * D^4,   Q = Cq(J) * rho * n^2 * D^5
//   Ct(J) = Ct0 * (1 - J/J0)  -- thrust falls as the prop advances into inflow,
// which is what limits climb rate and top speed on a real quad. Because each
// motor sees its own local inflow (including w x r from body rotation), roll/
// pitch aerodynamic damping emerges from this model without a separate term.

import { TAU, clamp } from './math.js';

export class Motor {
  constructor(motorCfg, propCfg) {
    this.cfg = motorCfg;
    this.prop = propCfg;
    this.Ke = 60 / (TAU * motorCfg.Kv);   // V per rad/s; equals Kt in N*m/A
    this.Kt = this.Ke;
    this.w = 0;            // shaft speed, rad/s (never negative: no 3D mode)
    this.thrust = 0;       // N
    this.torque = 0;       // aero reaction torque magnitude, N*m
    this.current = 0;      // motor current, A (signed; negative = braking)
    this.lastWdot = 0;     // rad/s^2, for spool-reaction yaw torque
  }

  reset() { this.w = 0; this.thrust = 0; this.torque = 0; this.current = 0; this.lastWdot = 0; }

  get rpm() { return this.w * 60 / TAU; }

  // u: ESC command 0..1, Vpack: battery voltage under load,
  // vAxial: air inflow along +thrust axis (m/s, positive = climbing),
  // groundEffect: thrust multiplier >= 1, ctNoise: propwash multiplier.
  step(u, Vpack, vAxial, rho, groundEffect, ctNoise, dt) {
    const p = this.prop, c = this.cfg;
    const n = this.w / TAU;

    // Advance ratio and coefficient washout.
    let ct = p.Ct0, cq = p.Cq0;
    if (n > 5) {
      const J = clamp(vAxial / (n * p.D), -1.5, 1.5);
      ct = p.Ct0 * clamp(1 - J / p.J0, -0.2, 1.35);
      cq = p.Cq0 * clamp(1 - 0.5 * J / p.J0, 0.3, 1.5);
    }
    const D4 = p.D ** 4, D5 = D4 * p.D;
    this.thrust = ct * rho * n * n * D4 * groundEffect * ctNoise;
    const Qaero = cq * rho * n * n * D5;
    this.torque = Qaero;

    // Electrical side.
    const V = u * Vpack;
    let I = (V - this.Ke * this.w) / c.R;
    I = clamp(I, -c.IbrakeMax, c.ImaxBurst);
    this.current = I;

    const friction = c.fricStatic * Math.tanh(this.w / 20) + c.fricVisc * this.w;
    const wdot = (this.Kt * I - friction - Qaero) / p.Jr;
    this.lastWdot = wdot;
    this.w = Math.max(0, this.w + wdot * dt);

    // Battery-side current: duty * motor current; regen ignored (conservative).
    return Math.max(0, u * I);
  }
}

export class Battery {
  constructor(cfg) {
    this.cfg = cfg;
    this.soc = 1.0;          // state of charge 0..1
    this.mAhUsed = 0;
    this.I = 0;              // last total draw, A
    this.Ifilt = 0;          // filtered draw used for the sag term
    this.V = this.ocv(1.0);  // terminal voltage under load
  }

  reset() { this.soc = 1.0; this.mAhUsed = 0; this.I = 0; this.Ifilt = 0; this.V = this.ocv(1.0); }

  // Open-circuit voltage for the whole pack at given state of charge.
  ocv(soc) {
    const t = this.cfg.ocv;
    const x = clamp(1 - soc, 0, 1) * (t.length - 1);
    const i = Math.min(Math.floor(x), t.length - 2);
    const f = x - i;
    return (t[i] * (1 - f) + t[i + 1] * f) * this.cfg.cells;
  }

  step(Itotal, dt) {
    this.I = Itotal;
    this.mAhUsed += Itotal * dt / 3.6;            // A*s -> mAh
    this.soc = clamp(1 - this.mAhUsed / this.cfg.capacity_mAh, 0, 1);
    // Filter the current feeding the sag term (~100 Hz). Physically: ESC bulk
    // capacitance; numerically: breaks the explicit V<->I algebraic loop,
    // whose gain (u/R * R_int * 4) exceeds 1 for this class of quad.
    const k = dt / (1 / (2 * Math.PI * 100) + dt);
    this.Ifilt += k * (Itotal - this.Ifilt);
    this.V = Math.max(this.ocv(this.soc) - this.Ifilt * this.cfg.R_int, 0.5);
    return this.V;
  }

  get cellV() { return this.V / this.cfg.cells; }
}
