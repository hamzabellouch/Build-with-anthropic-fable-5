// Input: keyboard with smooth ramping, optional mouse yoke, gamepad support.
// Writes into FlightModel.inputs once per frame; one-shot actions are queued
// in `this.actions` and consumed by main.js.

import { clamp, damp } from './util.js';

export class Controls {
  constructor(dom) {
    this.dom = dom;
    this.keys = new Set();
    this.invertPitch = false;
    this.mouseYoke = false;
    this.assist = false;

    // smoothed axes
    this.pitch = 0; this.roll = 0; this.yaw = 0;
    this.throttle = 0;
    this.brake = 0;
    this.trim = 0;
    this.mouse = { x: 0, y: 0, inside: false };
    this.actions = [];
    this.gamepadActive = false;
    this._gpPrev = {};
    this.enabled = true;
    this.wheelThrottle = 0;

    addEventListener('keydown', (e) => this.onKey(e, true));
    addEventListener('keyup', (e) => this.onKey(e, false));
    addEventListener('blur', () => this.keys.clear());
    dom.addEventListener('mousemove', (e) => {
      this.mouse.x = (e.clientX / innerWidth) * 2 - 1;
      this.mouse.y = (e.clientY / innerHeight) * 2 - 1;
      this.mouse.inside = true;
    });
    dom.addEventListener('mouseleave', () => { this.mouse.inside = false; });
    dom.addEventListener('wheel', (e) => {
      if (!this.enabled) return;
      this.wheelThrottle += e.deltaY < 0 ? 0.05 : -0.05;
    }, { passive: true });
  }

  onKey(e, down) {
    const k = e.code;
    if (down && !e.repeat) {
      // one-shot actions
      const oneShot = {
        KeyC: 'camera', KeyG: 'gear', KeyF: 'flapsDown', KeyR: 'flapsUp',
        KeyP: 'parking', KeyM: 'mouseYoke', KeyH: 'hud', KeyK: 'assist',
        KeyY: 'invert', Tab: 'afterburner', Escape: 'pause',
      };
      if (k === 'KeyR' && e.shiftKey) this.actions.push('restart');
      else if (oneShot[k]) this.actions.push(oneShot[k]);
      if (/^Digit\d$/.test(k)) {
        const d = parseInt(k.slice(5), 10);
        this.actions.push({ throttle: d === 0 ? 1.0 : d / 10 });
      }
    }
    if (['Tab', 'Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(k)) e.preventDefault();
    if (down) this.keys.add(k); else this.keys.delete(k);
  }

  key(...codes) {
    for (const c of codes) if (this.keys.has(c)) return true;
    return false;
  }

  // Smoothly drive an axis toward keyboard target.
  ramp(cur, target, dt, attack = 3.2, release = 5.5) {
    const rate = Math.abs(target) > Math.abs(cur) && Math.sign(target || 1) === Math.sign(cur || target || 1)
      ? attack : release;
    return damp(cur, target, rate, dt);
  }

  update(dt, fm) {
    if (!fm || !this.enabled) return;
    const inp = fm.inputs;

    // --- gamepad -----------------------------------------------------------
    let gp = null;
    if (navigator.getGamepads) {
      for (const g of navigator.getGamepads()) if (g && g.connected) { gp = g; break; }
    }
    let gpPitch = 0, gpRoll = 0, gpYaw = 0, gpThr = null, gpBrake = 0;
    if (gp) {
      const dz = (v) => (Math.abs(v) < 0.09 ? 0 : v);
      gpRoll = dz(gp.axes[0] || 0);
      gpPitch = dz(gp.axes[1] || 0) * -1;      // stick back (down) = pull
      gpYaw = dz(gp.axes[2] || 0);
      const rt = gp.buttons[7] ? gp.buttons[7].value : 0;
      const lt = gp.buttons[6] ? gp.buttons[6].value : 0;
      if (rt > 0.02) gpThr = rt;
      gpBrake = lt;
      this.gamepadActive = Math.abs(gpRoll) + Math.abs(gpPitch) + Math.abs(gpYaw) + rt + lt > 0.04;
      // edge-triggered buttons
      const edge = (i, name) => {
        const v = gp.buttons[i] && gp.buttons[i].pressed;
        if (v && !this._gpPrev[i]) this.actions.push(name);
        this._gpPrev[i] = v;
      };
      edge(0, 'gear');       // A
      edge(2, 'flapsDown');  // X
      edge(3, 'flapsUp');    // Y
      edge(5, 'camera');     // RB
      edge(1, 'afterburner');// B
    }

    // --- pitch / roll ---------------------------------------------------------
    let pT = 0, rT = 0;
    if (this.key('ArrowUp')) pT -= 1;    // stick forward = nose down
    if (this.key('ArrowDown')) pT += 1;  // stick back = nose up
    if (this.key('ArrowLeft')) rT -= 1;
    if (this.key('ArrowRight')) rT += 1;
    if (this.invertPitch) pT = -pT;

    if (this.mouseYoke && this.mouse.inside && !this.gamepadActive) {
      pT = clamp(-this.mouse.y * 1.8, -1, 1) * (this.invertPitch ? -1 : 1);
      rT = clamp(this.mouse.x * 1.8, -1, 1);
      this.pitch = damp(this.pitch, pT, 10, dt);
      this.roll = damp(this.roll, rT, 10, dt);
    } else if (this.gamepadActive) {
      this.pitch = damp(this.pitch, gpPitch, 18, dt);
      this.roll = damp(this.roll, gpRoll, 18, dt);
    } else {
      this.pitch = this.ramp(this.pitch, pT, dt);
      this.roll = this.ramp(this.roll, rT, dt);
    }

    // --- rudder ------------------------------------------------------------------
    let yT = 0;
    if (this.key('KeyA', 'KeyQ')) yT -= 1;
    if (this.key('KeyD', 'KeyE')) yT += 1;
    if (this.gamepadActive && Math.abs(gpYaw) > 0) {
      this.yaw = damp(this.yaw, gpYaw, 14, dt);
    } else {
      this.yaw = this.ramp(this.yaw, yT, dt, 2.8, 4.5);
    }

    // --- throttle ------------------------------------------------------------------
    if (this.key('KeyW', 'Equal', 'NumpadAdd')) this.throttle += 0.45 * dt;
    if (this.key('KeyS', 'Minus', 'NumpadSubtract')) this.throttle -= 0.45 * dt;
    this.throttle += this.wheelThrottle;
    this.wheelThrottle = 0;
    if (gpThr !== null) this.throttle = gpThr;
    this.throttle = clamp(this.throttle, 0, 1);

    // --- brakes ----------------------------------------------------------------------
    const brakeKey = this.key('KeyB', 'Space');
    this.brake = damp(this.brake, brakeKey ? 1 : gpBrake, 9, dt);

    // --- trim -------------------------------------------------------------------------
    if (this.key('KeyZ')) this.trim -= 0.22 * dt;
    if (this.key('KeyX')) this.trim += 0.22 * dt;
    this.trim = clamp(this.trim, -1, 1);

    // write to flight model
    inp.pitch = this.pitch;
    inp.roll = this.roll;
    inp.yaw = this.yaw;
    inp.throttle = this.throttle;
    inp.brake = this.brake;
    inp.trim = this.trim;
    inp.assist = this.assist;
    if (inp.parking && this.throttle > 0.45) inp.parking = false; // auto-release
  }

  // Sync internal state from a freshly reset flight model.
  syncFrom(fm) {
    this.pitch = this.roll = this.yaw = 0;
    this.throttle = fm.inputs.throttle;
    this.brake = 0;
    this.trim = fm.inputs.trim;
  }

  consumeActions() {
    const a = this.actions;
    this.actions = [];
    return a;
  }
}
