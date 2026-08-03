// Betaflight-style OSD overlay + stick visualization + tuning graph,
// drawn on a 2D canvas above the GL view.

import { RAD2DEG } from '../sim/math.js';

export class HUD {
  constructor(canvas) {
    this.cv = canvas;
    this.g = canvas.getContext('2d');
    this.showSticks = true;
    this.showGraph = false;
    this.msg = '';
    this.msgUntil = 0;
    this.vFilt = 0;
  }

  message(text, seconds = 2.5) {
    this.msg = text;
    this.msgUntil = performance.now() / 1000 + seconds;
  }

  resize(w, h, dpr) {
    this.cv.width = w * dpr; this.cv.height = h * dpr;
    this.g.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.w = w; this.h = h;
  }

  osdText(x, y, text, size = 17, color = '#e6e6e6', align = 'left') {
    const g = this.g;
    g.font = `700 ${size}px 'Consolas', 'DejaVu Sans Mono', monospace`;
    g.textAlign = align;
    g.lineWidth = 3;
    g.strokeStyle = 'rgba(0,0,0,0.85)';
    g.strokeText(text, x, y);
    g.fillStyle = color;
    g.fillText(text, x, y);
  }

  draw(state) {
    const { sim, inputs, race, view, timescale } = state;
    const g = this.g, w = this.w, h = this.h;
    g.clearRect(0, 0, w, h);
    const now = performance.now() / 1000;

    if (view === 'fpv') {
      // Crosshair
      g.strokeStyle = 'rgba(230,230,230,0.9)';
      g.lineWidth = 2;
      g.beginPath();
      g.moveTo(w / 2 - 11, h / 2); g.lineTo(w / 2 - 3, h / 2);
      g.moveTo(w / 2 + 3, h / 2); g.lineTo(w / 2 + 11, h / 2);
      g.moveTo(w / 2, h / 2 - 8); g.lineTo(w / 2, h / 2 - 3);
      g.stroke();
    }

    // --- Betaflight-ish OSD ---
    const bat = sim.battery;
    this.vFilt += 0.12 * (bat.V - this.vFilt);
    const cellV = this.vFilt / bat.cfg.cells;
    const vColor = cellV < 3.3 ? '#ff4040' : cellV < 3.55 ? '#ffd040' : '#e6e6e6';
    const blink = cellV < 3.3 && (now * 2 | 0) % 2 === 0;

    this.osdText(14, h - 44, `${this.vFilt.toFixed(1)}V`, 21, vColor);
    if (!blink) this.osdText(14, h - 20, `${cellV.toFixed(2)}V/cell`, 14, vColor);
    else this.osdText(14, h - 20, 'LAND NOW', 14, '#ff4040');
    this.osdText(118, h - 44, `${bat.I.toFixed(0).padStart(3)}A`, 17);
    this.osdText(118, h - 20, `${bat.mAhUsed.toFixed(0)} mAh`, 14);

    const t = sim.flightTime;
    this.osdText(w / 2, h - 20, `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(Math.floor(t % 60)).padStart(2, '0')}`, 17, '#e6e6e6', 'center');

    this.osdText(w - 14, h - 44, `${(sim.speed * 3.6).toFixed(0)} km/h`, 17, '#e6e6e6', 'right');
    this.osdText(w - 14, h - 20, `${sim.altitude.toFixed(1)} m`, 14, '#e6e6e6', 'right');

    const mode = sim.fc.angleMode ? 'ANGLE' : 'ACRO';
    const armTxt = sim.crashed ? 'CRASHED' : (sim.armed ? 'ARMED' : 'DISARMED');
    const armCol = sim.crashed ? '#ff4040' : (sim.armed ? '#7fff7f' : '#ffd040');
    this.osdText(14, 28, `${mode}`, 15);
    this.osdText(14, 50, armTxt, 15, armCol);
    this.osdText(14, 72, `THR ${(inputs.throttle * 100).toFixed(0)}%`, 13, '#bbb');
    if (timescale < 0.999) this.osdText(14, 94, `SLOWMO x${timescale.toFixed(2)}`, 13, '#7fd0ff');
    if (sim.washLevel > 0.25) this.osdText(14, 116, 'PROPWASH', 12, '#ff9a3d');

    // Race info
    if (race && race.enabled) {
      this.osdText(w - 14, 28, `GATE ${race.next + 1}/${race.total}`, 15, '#ffb300', 'right');
      if (race.lapStart != null)
        this.osdText(w - 14, 50, `LAP ${(sim.time - race.lapStart).toFixed(1)}s`, 14, '#e6e6e6', 'right');
      if (race.lastLap != null)
        this.osdText(w - 14, 72, `LAST ${race.lastLap.toFixed(2)}s`, 13, '#bbb', 'right');
      if (race.bestLap != null)
        this.osdText(w - 14, 92, `BEST ${race.bestLap.toFixed(2)}s`, 13, '#7fff7f', 'right');
    }

    // Center messages
    if (now < this.msgUntil)
      this.osdText(w / 2, h * 0.30, this.msg, 24, '#ffb300', 'center');
    if (sim.crashed)
      this.osdText(w / 2, h * 0.38, 'CRASHED — press R to reset', 20, '#ff5050', 'center');
    else if (!sim.armed && !state.menuOpen)
      this.osdText(w / 2, h * 0.42, 'ENTER / start button to ARM (throttle low)', 14, 'rgba(255,255,255,0.75)', 'center');

    if (this.showSticks) this.drawSticks(inputs);
    if (this.showGraph) this.drawGraph(sim);
  }

  drawSticks(inputs) {
    const g = this.g, h = this.h;
    const size = 74, pad = 12, y0 = h - 118 - pad;
    const boxes = [
      { x: this.w / 2 - size - 30, sx: inputs.yaw, sy: 1 - 2 * inputs.throttle },
      { x: this.w / 2 + 30, sx: inputs.roll, sy: inputs.pitch },   // pitch + = stick back = dot down
    ];
    for (const b of boxes) {
      g.fillStyle = 'rgba(0,0,0,0.35)';
      g.strokeStyle = 'rgba(255,255,255,0.5)';
      g.lineWidth = 1;
      g.fillRect(b.x, y0, size, size);
      g.strokeRect(b.x, y0, size, size);
      g.beginPath();
      g.moveTo(b.x + size / 2, y0); g.lineTo(b.x + size / 2, y0 + size);
      g.moveTo(b.x, y0 + size / 2); g.lineTo(b.x + size, y0 + size / 2);
      g.strokeStyle = 'rgba(255,255,255,0.18)';
      g.stroke();
      const px = b.x + size / 2 + b.sx * size * 0.46;
      const py = y0 + size / 2 + b.sy * size * 0.46;
      g.fillStyle = '#ffb300';
      g.beginPath();
      g.arc(px, py, 5, 0, 7);
      g.fill();
    }
  }

  // Setpoint-vs-gyro strip chart (like a blackbox viewer) for feel/tuning.
  drawGraph(sim) {
    const g = this.g, w = this.w;
    const gw = Math.min(560, w - 40), gh = 64, x0 = (w - gw) / 2, names = ['ROLL', 'PITCH', 'YAW'];
    const colors = ['#ff6060', '#60c0ff', '#ffd060'];
    for (let axis = 0; axis < 3; axis++) {
      const y0 = 60 + axis * (gh + 14);
      g.fillStyle = 'rgba(0,0,0,0.45)';
      g.fillRect(x0, y0, gw, gh);
      g.strokeStyle = 'rgba(255,255,255,0.25)';
      g.strokeRect(x0, y0, gw, gh);
      g.beginPath(); g.moveTo(x0, y0 + gh / 2); g.lineTo(x0 + gw, y0 + gh / 2);
      g.strokeStyle = 'rgba(255,255,255,0.15)'; g.stroke();
      this.osdText(x0 + 6, y0 + 16, names[axis], 11, colors[axis]);

      const tr = sim.trace;
      if (tr.length > 2) {
        const scale = (gh / 2) / 1000;   // ±1000 dps full scale
        for (const [key, alpha, lw] of [['sp', 0.55, 1], ['gyro', 1, 1.6]]) {
          g.beginPath();
          for (let i = 0; i < tr.length; i++) {
            const px = x0 + (i / (sim.traceMax - 1)) * gw;
            const py = y0 + gh / 2 - Math.max(-gh / 2, Math.min(gh / 2, tr[i][key][axis] * scale));
            i ? g.lineTo(px, py) : g.moveTo(px, py);
          }
          g.globalAlpha = alpha;
          g.strokeStyle = colors[axis];
          g.lineWidth = lw;
          g.stroke();
          g.globalAlpha = 1;
        }
      }
    }
    this.osdText(x0 + 6, 60 + 3 * (gh + 14) + 4, 'thin = setpoint, thick = gyro · ±1000°/s', 11, '#aaa');
  }
}
