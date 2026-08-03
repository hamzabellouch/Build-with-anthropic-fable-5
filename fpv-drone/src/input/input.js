// Input: USB RC transmitters (they enumerate as gamepads), regular gamepads,
// and a keyboard fallback.
//
// Output is pilot-normalized: roll/pitch/yaw in [-1,1] (right/back/right
// positive), throttle in [0,1]. Radios output absolute stick positions, so a
// detected gamepad axis maps 1:1 (with center/range calibration). Keyboard
// keys are binary, so they go through a slew filter and a rate scale to stay
// flyable.

import { clamp } from '../sim/math.js';

const DEFAULT_MAP = {
  axes: { roll: 0, pitch: 1, throttle: 2, yaw: 3 },
  invert: { roll: false, pitch: false, throttle: false, yaw: false },
  // throttleCentered: sprung gamepad stick (Xbox) vs real radio throttle.
  throttleCentered: false,
  deadband: 0.02,
  armButton: 0,
};

export class InputManager {
  constructor(store) {
    this.store = store;
    this.keys = new Set();
    this.kb = { roll: 0, pitch: 0, yaw: 0, throttle: 0 };
    this.kbRateScale = 0.55;   // keyboard taps full-deflect; scale down to stay controllable
    this.kbSmooth = 8;         // 1/s slew
    this.out = { roll: 0, pitch: 0, yaw: 0, throttle: 0 };
    this.gamepadIndex = -1;
    this.map = { ...DEFAULT_MAP, axes: { ...DEFAULT_MAP.axes }, invert: { ...DEFAULT_MAP.invert } };
    this.calib = null;        // per-axis {min,max,center}
    this.detecting = null;    // channel name during "move stick to detect"
    this.detectBase = null;
    this.onDetect = null;
    this.lastButtons = [];
    this.events = [];         // 'arm' button edges

    window.addEventListener('keydown', e => {
      if (e.repeat) return;
      this.keys.add(e.code);
    });
    window.addEventListener('keyup', e => this.keys.delete(e.code));
    window.addEventListener('gamepadconnected', e => {
      this.gamepadIndex = e.gamepad.index;
      this.loadMapFor(e.gamepad.id);
    });
    window.addEventListener('gamepaddisconnected', e => {
      if (e.gamepad.index === this.gamepadIndex) this.gamepadIndex = -1;
    });
  }

  loadMapFor(id) {
    const saved = this.store.get('map:' + id);
    if (saved) { this.map = saved.map; this.calib = saved.calib; }
  }
  saveMap() {
    const gp = this.gamepad();
    if (gp) this.store.set('map:' + gp.id, { map: this.map, calib: this.calib });
  }

  gamepad() {
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    if (this.gamepadIndex >= 0 && pads[this.gamepadIndex]) return pads[this.gamepadIndex];
    for (const p of pads) if (p && p.connected) { this.gamepadIndex = p.index; this.loadMapFor(p.id); return p; }
    return null;
  }

  get usingGamepad() { return this.gamepad() !== null; }

  // "Detect" flow: remember rest pose, first axis to move >0.45 wins.
  startDetect(channel, cb) {
    const gp = this.gamepad();
    if (!gp) return false;
    this.detecting = channel;
    this.detectBase = gp.axes.slice();
    this.onDetect = cb;
    return true;
  }

  calibrate() {
    // Capture current pose as centers; ranges learned continuously.
    const gp = this.gamepad();
    if (!gp) return;
    this.calib = gp.axes.map(v => ({ min: v - 0.01, max: v + 0.01, center: v }));
    this.saveMap();
  }

  axisValue(gp, ch) {
    const idx = this.map.axes[ch];
    let v = gp.axes[idx] ?? 0;
    if (this.calib && this.calib[idx]) {
      const c = this.calib[idx];
      c.min = Math.min(c.min, v); c.max = Math.max(c.max, v);
      // normalize around captured center to [-1, 1]
      v = v >= c.center
        ? (c.max - c.center > 0.01 ? (v - c.center) / (c.max - c.center) : 0)
        : (c.center - c.min > 0.01 ? (v - c.center) / (c.center - c.min) : 0);
    }
    if (this.map.invert[ch]) v = -v;
    return clamp(v, -1, 1);
  }

  update(dt) {
    const gp = this.gamepad();

    if (gp && this.detecting) {
      for (let i = 0; i < gp.axes.length; i++) {
        const d = gp.axes[i] - this.detectBase[i];
        if (Math.abs(d) > 0.45) {
          this.map.axes[this.detecting] = i;
          // Detect prompt asks the user to move the stick UP/RIGHT; calibrate
          // invert so axisValue() reads +1 in that direction for all channels.
          this.map.invert[this.detecting] = d < 0;
          this.saveMap();
          const ch = this.detecting;
          this.detecting = null;
          if (this.onDetect) this.onDetect(ch, i);
          break;
        }
      }
    }

    if (gp) {
      const db = this.map.deadband;
      const dead = v => Math.abs(v) < db ? 0 : (v - Math.sign(v) * db) / (1 - db);
      // Pilot convention out: roll/yaw + = right, pitch + = stick BACK (nose up).
      this.out.roll = dead(this.axisValue(gp, 'roll'));
      this.out.pitch = dead(-this.axisValue(gp, 'pitch'));   // axisValue + = stick forward
      this.out.yaw = dead(this.axisValue(gp, 'yaw'));
      const th = this.axisValue(gp, 'throttle');
      this.out.throttle = this.map.throttleCentered
        ? clamp(Math.max(0, th), 0, 1)             // sprung stick: up half only
        : clamp((th + 1) / 2, 0, 1);               // radio: full travel
      // arm button edge
      const b = this.map.armButton;
      const pressed = gp.buttons[b] && gp.buttons[b].pressed;
      if (pressed && !this.lastButtons[b]) this.events.push('arm');
      this.lastButtons = gp.buttons.map(x => x.pressed);
    } else {
      // Keyboard: slew-limited virtual sticks.
      const tgt = {
        roll: (this.keys.has('ArrowRight') ? 1 : 0) - (this.keys.has('ArrowLeft') ? 1 : 0),
        pitch: (this.keys.has('ArrowDown') ? 1 : 0) - (this.keys.has('ArrowUp') ? 1 : 0),
        yaw: (this.keys.has('KeyD') ? 1 : 0) - (this.keys.has('KeyA') ? 1 : 0),
      };
      for (const ch of ['roll', 'pitch', 'yaw']) {
        const t = tgt[ch] * this.kbRateScale;
        const k = clamp(this.kbSmooth * dt, 0, 1);
        this.kb[ch] += (t - this.kb[ch]) * k;
        this.out[ch] = Math.abs(this.kb[ch]) < 0.004 ? 0 : this.kb[ch];
      }
      const dthr = ((this.keys.has('KeyW') ? 1 : 0) - (this.keys.has('KeyS') ? 1 : 0)) * 0.9 * dt;
      this.kb.throttle = clamp(this.kb.throttle + dthr, 0, 1);
      if (this.keys.has('Space')) this.kb.throttle = 0;       // throttle cut
      this.out.throttle = this.kb.throttle;
    }
    return this.out;
  }

  takeEvents() { const e = this.events; this.events = []; return e; }
}
