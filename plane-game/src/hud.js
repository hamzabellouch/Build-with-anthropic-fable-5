// Canvas-2D flight instruments: six-pack (ASI, attitude, altimeter, heading,
// VSI, engine) + status block, warnings, and a military-style HUD overlay.

import { clamp, lerp, wrap360, MS2KT, M2FT, MS2FPM, RAD2DEG, DEG2RAD } from './util.js';

const FONT = '"Segoe UI", Arial, sans-serif';
const MONO = '"Consolas", "Menlo", monospace';

export class HUD {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.resize();
    this.flashT = 0;
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.dpr = dpr;
    this.canvas.width = Math.floor(innerWidth * dpr);
    this.canvas.height = Math.floor(innerHeight * dpr);
    this.canvas.style.width = innerWidth + 'px';
    this.canvas.style.height = innerHeight + 'px';
  }

  draw(fm, opts) {
    const ctx = this.ctx;
    const W = innerWidth, H = innerHeight;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    if (!fm) return;
    this.flashT += opts.dt || 0.016;
    const out = fm.out, af = fm.af;
    const cockpit = opts.camMode === 1;

    if (opts.hudMode || (af.id === 'f16' && cockpit)) {
      this.drawMilHUD(fm, W, H, cockpit);
    }

    // instrument cluster
    const scale = cockpit ? 1.0 : 0.78;
    const r = 62 * scale;
    const gap = 10 * scale;
    const n = 6;
    const totalW = n * (r * 2) + (n - 1) * gap;
    const x0 = cockpit ? (W - totalW) / 2 + r : 18 + r;
    const y0 = H - r - 14;

    if (cockpit) {
      // panel backdrop
      ctx.fillStyle = 'rgba(16,18,22,0.92)';
      ctx.beginPath();
      ctx.roundRect((W - totalW) / 2 - 18, H - r * 2 - 30, totalW + 36, r * 2 + 40, 10);
      ctx.fill();
      ctx.strokeStyle = 'rgba(90,110,130,0.35)';
      ctx.stroke();
    }

    const X = (i) => x0 + i * (r * 2 + gap);
    this.drawASI(X(0), y0, r, out, af);
    this.drawAttitude(X(1), y0, r, out);
    this.drawAltimeter(X(2), y0, r, out);
    this.drawHeading(X(3), y0, r, out);
    this.drawVSI(X(4), y0, r, out);
    this.drawEngine(X(5), y0, r, out, fm);

    this.drawStatus(fm, W, H, opts);
    this.drawWarnings(fm, W, H);
    if (!opts.hudMode && !(af.id === 'f16' && cockpit)) this.drawGMeter(fm, W, H, X(5) + r + 14, y0);
  }

  // --- dial helpers ---------------------------------------------------------
  dialFace(x, y, r) {
    const ctx = this.ctx;
    ctx.save();
    const g = ctx.createRadialGradient(x, y - r * 0.4, r * 0.2, x, y, r * 1.1);
    g.addColorStop(0, '#23262b');
    g.addColorStop(1, '#101216');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#3a4048';
    ctx.stroke();
    ctx.restore();
  }

  needle(x, y, ang, len, width, color, tailLen = 0.18) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(ang);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(-width, len * tailLen);
    ctx.lineTo(width, len * tailLen);
    ctx.lineTo(width * 0.35, -len);
    ctx.lineTo(-width * 0.35, -len);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath(); ctx.arc(0, 0, width * 1.7, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  label(x, y, txt, size, color = '#cfd8e0', align = 'center', font = FONT, bold = false) {
    const ctx = this.ctx;
    ctx.fillStyle = color;
    ctx.font = `${bold ? 'bold ' : ''}${size}px ${font}`;
    ctx.textAlign = align;
    ctx.textBaseline = 'middle';
    ctx.fillText(txt, x, y);
  }

  // --- airspeed -------------------------------------------------------------
  drawASI(x, y, r, out, af) {
    const ctx = this.ctx;
    this.dialFace(x, y, r);
    const vneKt = af.vne * MS2KT;
    const maxKt = Math.ceil((vneKt * 1.12) / 20) * 20;
    const a0 = -Math.PI * 0.78, a1 = Math.PI * 0.78;   // sweep (top = -π/2 reference handled below)
    const toAng = (kt) => lerp(a0, a1, clamp(kt / maxKt, 0, 1));
    // coloured arcs
    const arcs = af.id === 'f16'
      ? [[120, vneKt * 0.85, '#37c95c'], [vneKt * 0.85, vneKt, '#e8c33a']]
      : [[Math.round(vneKt * 0.28), vneKt * 0.62, '#37c95c'], [vneKt * 0.62, vneKt, '#e8c33a']];
    ctx.save();
    ctx.translate(x, y);
    ctx.lineWidth = 5;
    for (const [k0, k1, c] of arcs) {
      ctx.strokeStyle = c;
      ctx.beginPath();
      ctx.arc(0, 0, r - 7, toAng(k0) - Math.PI / 2, toAng(k1) - Math.PI / 2);
      ctx.stroke();
    }
    ctx.strokeStyle = '#e23a2e';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(0, 0, r - 7, toAng(vneKt) - Math.PI / 2, toAng(Math.min(vneKt * 1.06, maxKt)) - Math.PI / 2);
    ctx.stroke();
    // ticks
    const step = maxKt > 400 ? 50 : 20;
    for (let k = 0; k <= maxKt; k += step / 2) {
      const major = k % step === 0;
      const ang = toAng(k) - Math.PI / 2;
      ctx.strokeStyle = '#cfd8e0';
      ctx.lineWidth = major ? 2 : 1;
      ctx.beginPath();
      ctx.moveTo(Math.cos(ang) * (r - 12), Math.sin(ang) * (r - 12));
      ctx.lineTo(Math.cos(ang) * (r - (major ? 20 : 16)), Math.sin(ang) * (r - (major ? 20 : 16)));
      ctx.stroke();
      if (major && k > 0) {
        this.label(Math.cos(ang) * (r - 30), Math.sin(ang) * (r - 30), String(k), r * 0.17, '#cfd8e0', 'center', FONT);
      }
    }
    ctx.restore();
    this.label(x, y + r * 0.42, 'KNOTS', r * 0.14, '#8a98a5');
    this.label(x, y - r * 0.35, 'IAS', r * 0.15, '#8a98a5');
    const kt = out.ias * MS2KT;
    this.needle(x, y, toAng(kt), r - 22, 3.2, '#f2f5f8');
    this.label(x, y + r * 0.62, Math.round(kt) + '', r * 0.2, '#fff', 'center', MONO, true);
  }

  // --- attitude indicator -----------------------------------------------------
  drawAttitude(x, y, r, out) {
    const ctx = this.ctx;
    this.dialFace(x, y, r);
    ctx.save();
    ctx.beginPath(); ctx.arc(x, y, r - 7, 0, Math.PI * 2); ctx.clip();
    ctx.translate(x, y);
    ctx.rotate(-out.roll);
    const pxDeg = (r * 1.5) / 45;
    const py = out.pitch * RAD2DEG * pxDeg;
    ctx.translate(0, py);
    // sky & ground
    ctx.fillStyle = '#2f6fc2';
    ctx.fillRect(-r * 2, -r * 4, r * 4, r * 4);
    ctx.fillStyle = '#7a5631';
    ctx.fillRect(-r * 2, 0, r * 4, r * 4);
    ctx.strokeStyle = '#f5f7fa';
    ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(-r * 2, 0); ctx.lineTo(r * 2, 0); ctx.stroke();
    // pitch ladder
    for (let d = -30; d <= 30; d += 10) {
      if (d === 0) continue;
      const ly = -d * pxDeg;
      const lw = Math.abs(d) % 20 === 0 ? r * 0.34 : r * 0.2;
      ctx.beginPath(); ctx.moveTo(-lw, ly); ctx.lineTo(lw, ly); ctx.stroke();
      if (Math.abs(d) % 20 === 0) {
        this.label(-lw - 9, ly, Math.abs(d), r * 0.13, '#f5f7fa');
        this.label(lw + 9, ly, Math.abs(d), r * 0.13, '#f5f7fa');
      }
    }
    ctx.restore();
    // bank scale
    ctx.save();
    ctx.translate(x, y);
    for (const b of [-60, -45, -30, -20, -10, 0, 10, 20, 30, 45, 60]) {
      const ang = -b * DEG2RAD - Math.PI / 2;
      const len = b === 0 ? 9 : (b % 30 === 0 ? 7 : 4);
      ctx.strokeStyle = '#f5f7fa';
      ctx.lineWidth = b === 0 ? 2.4 : 1.4;
      ctx.beginPath();
      ctx.moveTo(Math.cos(ang) * (r - 9), Math.sin(ang) * (r - 9));
      ctx.lineTo(Math.cos(ang) * (r - 9 - len), Math.sin(ang) * (r - 9 - len));
      ctx.stroke();
    }
    // roll pointer
    ctx.rotate(-out.roll);
    ctx.fillStyle = '#ffce3a';
    ctx.beginPath();
    ctx.moveTo(0, -r + 11);
    ctx.lineTo(-5, -r + 20);
    ctx.lineTo(5, -r + 20);
    ctx.closePath(); ctx.fill();
    ctx.restore();
    // fixed aircraft symbol
    ctx.save();
    ctx.translate(x, y);
    ctx.strokeStyle = '#ffb43a';
    ctx.lineWidth = 3.4;
    ctx.beginPath();
    ctx.moveTo(-r * 0.42, 0); ctx.lineTo(-r * 0.14, 0); ctx.lineTo(-r * 0.07, r * 0.09);
    ctx.moveTo(r * 0.42, 0); ctx.lineTo(r * 0.14, 0); ctx.lineTo(r * 0.07, r * 0.09);
    ctx.stroke();
    ctx.fillStyle = '#ffb43a';
    ctx.beginPath(); ctx.arc(0, 0, 2.6, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  // --- altimeter ---------------------------------------------------------------
  drawAltimeter(x, y, r, out) {
    const ctx = this.ctx;
    this.dialFace(x, y, r);
    const ft = out.alt * M2FT;
    ctx.save();
    ctx.translate(x, y);
    for (let i = 0; i < 10; i++) {
      const ang = (i / 10) * Math.PI * 2 - Math.PI / 2;
      ctx.strokeStyle = '#cfd8e0'; ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(ang) * (r - 10), Math.sin(ang) * (r - 10));
      ctx.lineTo(Math.cos(ang) * (r - 18), Math.sin(ang) * (r - 18));
      ctx.stroke();
      this.label(Math.cos(ang) * (r - 27), Math.sin(ang) * (r - 27), String(i), r * 0.17, '#cfd8e0');
      for (let j = 1; j < 5; j++) {
        const a2 = ang + (j / 50) * Math.PI * 2;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a2) * (r - 10), Math.sin(a2) * (r - 10));
        ctx.lineTo(Math.cos(a2) * (r - 14), Math.sin(a2) * (r - 14));
        ctx.stroke();
      }
    }
    ctx.restore();
    this.label(x, y - r * 0.35, 'ALT', r * 0.15, '#8a98a5');
    this.label(x, y + r * 0.42, 'FEET', r * 0.13, '#8a98a5');
    this.label(x, y + r * 0.62, Math.round(ft).toLocaleString(), r * 0.2, '#fff', 'center', MONO, true);
    const a1k = ((ft % 1000) / 1000) * Math.PI * 2;
    const a10k = ((ft % 10000) / 10000) * Math.PI * 2;
    this.needle(x, y, a10k, r * 0.45, 4, '#cfd8e0');
    this.needle(x, y, a1k, r - 24, 3, '#f2f5f8');
  }

  // --- heading gyro ---------------------------------------------------------------
  drawHeading(x, y, r, out) {
    const ctx = this.ctx;
    this.dialFace(x, y, r);
    const hdg = out.heading;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-hdg);
    const names = { 0: 'N', 90: 'E', 180: 'S', 270: 'W' };
    for (let d = 0; d < 360; d += 10) {
      const ang = d * DEG2RAD - Math.PI / 2;
      const major = d % 30 === 0;
      ctx.strokeStyle = '#cfd8e0';
      ctx.lineWidth = major ? 2 : 1;
      ctx.beginPath();
      ctx.moveTo(Math.cos(ang) * (r - 9), Math.sin(ang) * (r - 9));
      ctx.lineTo(Math.cos(ang) * (r - (major ? 17 : 13)), Math.sin(ang) * (r - (major ? 17 : 13)));
      ctx.stroke();
      if (major) {
        const t = names[d] || String(d / 10);
        ctx.save();
        ctx.translate(Math.cos(ang) * (r - 26), Math.sin(ang) * (r - 26));
        ctx.rotate(d * DEG2RAD);
        this.label(0, 0, t, r * (names[d] ? 0.19 : 0.15), names[d] ? '#fff' : '#cfd8e0');
        ctx.restore();
      }
    }
    ctx.restore();
    // lubber line + plane
    ctx.save();
    ctx.translate(x, y);
    ctx.strokeStyle = '#ffce3a';
    ctx.lineWidth = 2.4;
    ctx.beginPath(); ctx.moveTo(0, -r + 6); ctx.lineTo(0, -r + 18); ctx.stroke();
    ctx.strokeStyle = '#ffb43a';
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.3); ctx.lineTo(0, r * 0.22);
    ctx.moveTo(-r * 0.22, 0); ctx.lineTo(r * 0.22, 0);
    ctx.stroke();
    ctx.restore();
    const deg = wrap360(hdg * RAD2DEG);
    this.label(x, y + r * 0.62, String(Math.round(deg)).padStart(3, '0') + '°', r * 0.2, '#fff', 'center', MONO, true);
  }

  // --- VSI ---------------------------------------------------------------------------
  drawVSI(x, y, r, out) {
    const ctx = this.ctx;
    this.dialFace(x, y, r);
    const fpm = clamp(out.vs * MS2FPM, -2200, 2200);
    const toAng = (v) => Math.PI + (v / 2000) * Math.PI * 0.78; // 0 -> pointing left
    ctx.save();
    ctx.translate(x, y);
    for (let v = -2000; v <= 2000; v += 500) {
      const ang = toAng(v);
      const major = v % 1000 === 0;
      ctx.strokeStyle = '#cfd8e0';
      ctx.lineWidth = major ? 2 : 1;
      ctx.beginPath();
      ctx.moveTo(Math.cos(ang) * (r - 9), Math.sin(ang) * (r - 9));
      ctx.lineTo(Math.cos(ang) * (r - (major ? 17 : 13)), Math.sin(ang) * (r - (major ? 17 : 13)));
      ctx.stroke();
      if (major) {
        this.label(Math.cos(ang) * (r - 27), Math.sin(ang) * (r - 27), String(Math.abs(v / 1000)), r * 0.16, '#cfd8e0');
      }
    }
    ctx.restore();
    this.label(x, y - r * 0.30, 'VS', r * 0.15, '#8a98a5');
    this.label(x, y + r * 0.36, '×1000 FPM', r * 0.11, '#8a98a5');
    // needle: convert dial angle to needle() convention (0 = up)
    this.needle(x, y, toAng(fpm) + Math.PI / 2, r - 22, 3.2, '#f2f5f8');
    this.label(x, y + r * 0.62, (fpm > 0 ? '+' : '') + Math.round(fpm / 10) * 10, r * 0.19, '#fff', 'center', MONO, true);
  }

  // --- engine -----------------------------------------------------------------------
  drawEngine(x, y, r, out, fm) {
    const ctx = this.ctx;
    const af = fm.af;
    this.dialFace(x, y, r);
    const jet = af.engine.type === 'jet';
    const maxV = jet ? 110 : af.engine.rpmMax * 1.1;
    const val = jet ? (out.powerFrac / 1.65) * 100 : out.rpm;
    const a0 = -Math.PI * 0.75, a1 = Math.PI * 0.75;
    const toAng = (v) => lerp(a0, a1, clamp(v / maxV, 0, 1));
    ctx.save();
    ctx.translate(x, y);
    const greenEnd = jet ? 100 : af.engine.rpmMax;
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#37c95c';
    ctx.beginPath();
    ctx.arc(0, 0, r - 7, toAng(jet ? 60 : af.engine.rpmMax * 0.55) - Math.PI / 2, toAng(greenEnd) - Math.PI / 2);
    ctx.stroke();
    const step = jet ? 20 : 500;
    for (let v = 0; v <= maxV; v += step) {
      const ang = toAng(v) - Math.PI / 2;
      ctx.strokeStyle = '#cfd8e0';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(ang) * (r - 10), Math.sin(ang) * (r - 10));
      ctx.lineTo(Math.cos(ang) * (r - 17), Math.sin(ang) * (r - 17));
      ctx.stroke();
      this.label(Math.cos(ang) * (r - 27), Math.sin(ang) * (r - 27), String(jet ? v : v / 100), r * 0.14, '#cfd8e0');
    }
    ctx.restore();
    this.label(x, y - r * 0.33, jet ? 'THRUST %' : 'RPM ×100', r * 0.12, '#8a98a5');
    this.needle(x, y, toAng(val), r - 22, 3.2, '#f2f5f8');
    this.label(x, y + r * 0.40, jet ? Math.round(val) + '%' : Math.round(out.rpm), r * 0.18, '#fff', 'center', MONO, true);
    if (jet && fm.inputs.afterburner && out.powerFrac > 1.05) {
      this.label(x, y + r * 0.64, 'AB', r * 0.2, '#ff9b2a', 'center', FONT, true);
    }
  }

  // --- status block -------------------------------------------------------------------
  drawStatus(fm, W, H, opts) {
    const ctx = this.ctx;
    const out = fm.out, af = fm.af, inp = fm.inputs;
    const lines = [];
    lines.push([af.name.toUpperCase(), '#9fc3d8']);
    lines.push([`THR  ${Math.round(inp.throttle * 100)}%${inp.afterburner ? '  AB' : ''}`, '#dce8f2']);
    if (af.flapNotches.length > 1) lines.push([`FLAP ${Math.round(out.flapDeg)}°`, out.flapDeg > 0.5 ? '#7fd4ff' : '#8a98a5']);
    if (af.gear.retractable) {
      const g = out.gearTransit ? 'TRANSIT' : (inp.gearDown ? 'DOWN' : 'UP');
      lines.push([`GEAR ${g}`, out.gearTransit ? '#ffce3a' : (inp.gearDown ? '#37c95c' : '#8a98a5')]);
    }
    if (Math.abs(inp.trim) > 0.005) lines.push([`TRIM ${inp.trim > 0 ? 'UP' : 'DN'} ${Math.abs(inp.trim * 100).toFixed(0)}%`, '#dce8f2']);
    if (inp.parking) lines.push(['PARK BRAKE SET', '#ff7a5c']);
    else if (inp.brake > 0.05) lines.push(['BRAKES', '#ffce3a']);
    if (out.windKt > 1) lines.push([`WIND ${String(Math.round(wrap360(out.windDir * RAD2DEG))).padStart(3, '0')}/${Math.round(out.windKt)}kt`, '#8fb2c6']);
    lines.push([`AGL  ${Math.max(0, Math.round(out.agl * M2FT))} ft`, '#8fb2c6']);

    ctx.save();
    ctx.globalAlpha = 0.92;
    let y = 16;
    for (const [txt, color] of lines) {
      ctx.font = `13px ${MONO}`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillStyle = 'rgba(8,14,20,0.55)';
      const w = ctx.measureText(txt).width;
      ctx.fillRect(12, y - 2, w + 14, 19);
      ctx.fillStyle = color;
      ctx.fillText(txt, 19, y);
      y += 20;
    }
    ctx.restore();

    // camera label, bottom-right
    const camNames = ['CHASE CAM', 'COCKPIT', 'ORBIT CAM', 'TOWER CAM', 'FLYBY CAM'];
    ctx.font = `11px ${MONO}`;
    ctx.fillStyle = 'rgba(160,190,210,0.65)';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillText(`${camNames[opts.camMode] || ''}   [C]`, W - 14, H - 12);
  }

  // --- warnings --------------------------------------------------------------------------
  drawWarnings(fm, W, H) {
    const out = fm.out, af = fm.af, inp = fm.inputs;
    const msgs = [];
    const flash = Math.sin(this.flashT * 11) > -0.2;
    if (out.stalled && flash) msgs.push(['STALL', '#ff3b28']);
    else if (out.aoaFrac > 0.82 && !out.onGround && flash) msgs.push(['STALL WARNING', '#ff9b2a']);
    if (out.overspeed && flash) msgs.push(['OVERSPEED', '#ff3b28']);
    if (af.gear.retractable && !inp.gearDown && out.agl < 150 && out.vs < -1 && flash) msgs.push(['GEAR UP', '#ffce3a']);
    if (Math.abs(out.G) > af.gLimitPos && flash) msgs.push([`OVER-G  ${out.G.toFixed(1)}`, '#ff9b2a']);

    const ctx = this.ctx;
    let y = H * 0.24;
    for (const [m, c] of msgs) {
      ctx.font = `bold 26px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = 'rgba(10,4,4,0.55)';
      const w = ctx.measureText(m).width;
      ctx.fillRect(W / 2 - w / 2 - 16, y - 18, w + 32, 36);
      ctx.fillStyle = c;
      ctx.fillText(m, W / 2, y);
      y += 44;
    }
  }

  drawGMeter(fm, W, H, x, y) {
    const ctx = this.ctx;
    const out = fm.out, af = fm.af;
    // G + AoA vertical bars
    const bh = 96;
    const drawBar = (bx, val, vmin, vmax, marks, label, color) => {
      ctx.fillStyle = 'rgba(8,14,20,0.6)';
      ctx.fillRect(bx, y - bh / 2 - 14, 26, bh + 22);
      const t = clamp((val - vmin) / (vmax - vmin), 0, 1);
      const by = y + bh / 2 - t * bh;
      ctx.fillStyle = color;
      ctx.fillRect(bx + 3, by, 20, y + bh / 2 - by);
      ctx.strokeStyle = '#5a6b7a';
      for (const m of marks) {
        const mt = (m - vmin) / (vmax - vmin);
        const my = y + bh / 2 - mt * bh;
        ctx.beginPath(); ctx.moveTo(bx, my); ctx.lineTo(bx + 26, my); ctx.stroke();
      }
      this.label(bx + 13, y - bh / 2 - 7, label, 10, '#8fb2c6');
      this.label(bx + 13, y + bh / 2 + 13, (Math.round(val * 10) / 10).toFixed(1), 11, '#fff', 'center', MONO);
    };
    drawBar(x, out.G, -2, Math.max(af.gLimitPos + 1, 5), [0, 1, af.gLimitPos], 'G', out.G > af.gLimitPos ? '#ff9b2a' : '#53d2ff');
    drawBar(x + 34, out.aoaFrac * 100, -20, 120, [0, 50, 100], 'AoA', out.aoaFrac > 0.82 ? '#ff5a3c' : '#37c95c');
  }

  // --- military HUD -------------------------------------------------------------------------
  drawMilHUD(fm, W, H, cockpit) {
    const ctx = this.ctx;
    const out = fm.out;
    const cx = W / 2, cy = H * (cockpit ? 0.42 : 0.40);
    const green = '#41ff7d';
    ctx.save();
    ctx.strokeStyle = green;
    ctx.fillStyle = green;
    ctx.lineWidth = 1.6;
    ctx.shadowColor = 'rgba(65,255,125,0.6)';
    ctx.shadowBlur = 4;
    ctx.font = `15px ${MONO}`;

    const pxDeg = H * 0.022;

    // pitch ladder (rotated by roll about the boresight)
    ctx.save();
    ctx.beginPath();
    ctx.rect(cx - W * 0.17, cy - H * 0.23, W * 0.34, H * 0.46);
    ctx.clip();
    ctx.translate(cx, cy);
    ctx.rotate(out.roll);
    const pitchDeg = out.pitch * RAD2DEG;
    ctx.translate(0, pitchDeg * pxDeg);
    for (let d = -90; d <= 90; d += 5) {
      const ly = -d * pxDeg;
      if (Math.abs(ly + pitchDeg * pxDeg) > H * 0.26) continue;
      const wHalf = d === 0 ? W * 0.13 : W * 0.055;
      ctx.setLineDash(d < 0 ? [6, 5] : []);
      ctx.beginPath();
      if (d === 0) {
        ctx.moveTo(-wHalf, ly); ctx.lineTo(-W * 0.03, ly);
        ctx.moveTo(W * 0.03, ly); ctx.lineTo(wHalf, ly);
      } else {
        const tick = d > 0 ? 6 : -6;
        ctx.moveTo(-wHalf, ly + tick); ctx.lineTo(-wHalf, ly);
        ctx.lineTo(-W * 0.022, ly);
        ctx.moveTo(W * 0.022, ly); ctx.lineTo(wHalf, ly);
        ctx.lineTo(wHalf, ly + tick);
      }
      ctx.stroke();
      ctx.setLineDash([]);
      if (d !== 0 && d % 10 === 0) {
        ctx.textAlign = 'left';
        ctx.fillText(String(Math.abs(d)), wHalf + 6, ly + 4);
        ctx.textAlign = 'right';
        ctx.fillText(String(Math.abs(d)), -wHalf - 6, ly + 4);
      }
    }
    ctx.restore();

    // flight-path marker (velocity vector)
    if (out.tas > 8) {
      const gamma = Math.asin(clamp(out.vs / Math.max(out.tas, 1), -1, 1)) * RAD2DEG;
      const dy = (out.pitch * RAD2DEG - gamma) * pxDeg;
      const dx = out.beta * RAD2DEG * pxDeg * -1;
      ctx.beginPath();
      ctx.arc(cx + dx, cy + dy, 7, 0, Math.PI * 2);
      ctx.moveTo(cx + dx - 16, cy + dy); ctx.lineTo(cx + dx - 7, cy + dy);
      ctx.moveTo(cx + dx + 7, cy + dy); ctx.lineTo(cx + dx + 16, cy + dy);
      ctx.moveTo(cx + dx, cy + dy - 7); ctx.lineTo(cx + dx, cy + dy - 13);
      ctx.stroke();
    }
    // boresight
    ctx.beginPath();
    ctx.moveTo(cx - 5, cy); ctx.lineTo(cx + 5, cy);
    ctx.moveTo(cx, cy - 4); ctx.lineTo(cx, cy + 4);
    ctx.stroke();

    // speed box (left) & alt box (right)
    const box = (bx, by, txt, w = 86) => {
      ctx.strokeRect(bx - w / 2, by - 15, w, 30);
      ctx.textAlign = 'center';
      ctx.font = `bold 17px ${MONO}`;
      ctx.fillText(txt, bx, by + 6);
      ctx.font = `15px ${MONO}`;
    };
    box(cx - W * 0.22, cy, String(Math.round(out.ias * MS2KT)));
    box(cx + W * 0.22, cy, Math.round(out.alt * M2FT).toLocaleString(), 104);
    ctx.textAlign = 'center';
    ctx.fillText('IAS', cx - W * 0.22, cy - 24);
    ctx.fillText('ALT', cx + W * 0.22, cy - 24);
    ctx.fillText(`M ${out.mach.toFixed(2)}`, cx - W * 0.22, cy + 34);
    ctx.fillText(`G ${out.G.toFixed(1)}`, cx - W * 0.22, cy + 54);
    ctx.fillText(`α ${(out.alpha * RAD2DEG).toFixed(1)}`, cx - W * 0.22, cy + 74);
    ctx.fillText(`VS ${out.vs > 0 ? '+' : ''}${Math.round(out.vs * MS2FPM)}`, cx + W * 0.22, cy + 34);

    // heading tape (top)
    const hdg = wrap360(out.heading * RAD2DEG);
    const ty = cy - H * 0.26;
    ctx.save();
    ctx.beginPath();
    ctx.rect(cx - 130, ty - 22, 260, 34);
    ctx.clip();
    for (let d = -40; d <= 40; d += 5) {
      let hh = Math.round((hdg + d) / 5) * 5;
      const wrapped = (((hh - hdg) % 360) + 540) % 360 - 180;
      const tx = cx + wrapped * 3.2;
      hh = ((hh % 360) + 360) % 360;
      const major = hh % 10 === 0;
      ctx.beginPath();
      ctx.moveTo(tx, ty + 4); ctx.lineTo(tx, ty + (major ? -4 : 0));
      ctx.stroke();
      if (major) {
        ctx.textAlign = 'center';
        ctx.font = `13px ${MONO}`;
        ctx.fillText(String(hh / 10).padStart(2, '0'), tx, ty - 9);
      }
    }
    ctx.restore();
    ctx.beginPath();
    ctx.moveTo(cx, ty + 8); ctx.lineTo(cx - 5, ty + 15); ctx.lineTo(cx + 5, ty + 15);
    ctx.closePath(); ctx.fill();

    ctx.restore();
  }
}
