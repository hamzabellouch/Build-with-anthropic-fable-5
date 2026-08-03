import * as THREE from 'three';
import { SHORTCUT_GROUPS } from '../core/keymap.js';

const TOOL_ICONS = {
  select: `<svg width="16" height="16" viewBox="0 0 16 16"><path d="M4 1.5 L12 8.6 L8.6 9 L10.4 13 L8.7 13.8 L6.9 9.9 L4 12.4 Z" fill="currentColor"/></svg>`,
  move: `<svg width="16" height="16" viewBox="0 0 16 16"><path d="M8 1 L6.2 3.6 H9.8 Z M8 15 L6.2 12.4 H9.8 Z M1 8 L3.6 6.2 V9.8 Z M15 8 L12.4 6.2 V9.8 Z" fill="currentColor"/><path d="M8 3.4 V12.6 M3.4 8 H12.6" stroke="currentColor" stroke-width="1.2"/></svg>`,
  rotate: `<svg width="16" height="16" viewBox="0 0 16 16"><path d="M13.5 8 A5.5 5.5 0 1 1 8 2.5" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M8 0.2 L11.4 2.5 L8 4.8 Z" fill="currentColor"/></svg>`,
  scale: `<svg width="16" height="16" viewBox="0 0 16 16"><rect x="2.5" y="8" width="5.5" height="5.5" fill="none" stroke="currentColor" stroke-width="1.2"/><path d="M9.5 6.5 L13.5 2.5 M13.5 2.5 H10 M13.5 2.5 V6" stroke="currentColor" stroke-width="1.3" fill="none"/></svg>`,
};

export function buildToolbar(app, viewportEl) {
  const bar = document.createElement('div');
  bar.className = 'toolbar';
  const tools = [
    ['select', 'Select (click; B box select)'],
    ['move', 'Move (or press G)'],
    ['rotate', 'Rotate (or press R)'],
    ['scale', 'Scale (or press S)'],
  ];
  const btns = {};
  for (const [id, tip] of tools) {
    const b = document.createElement('button');
    b.className = 'tool-btn';
    b.title = tip;
    b.innerHTML = TOOL_ICONS[id];
    b.addEventListener('click', () => app.setTool(id));
    bar.appendChild(b);
    btns[id] = b;
  }
  const refresh = () => {
    for (const id of Object.keys(btns)) btns[id].classList.toggle('active', app.tool === id);
  };
  app.events.on('tool-changed', refresh);
  refresh();
  viewportEl.appendChild(bar);
  return bar;
}

export function buildViewportLabel(app, viewportEl) {
  const div = document.createElement('div');
  div.className = 'viewport-label';
  const line1 = document.createElement('div');
  const line2 = document.createElement('div');
  line2.className = 'obj-line';
  div.appendChild(line1);
  div.appendChild(line2);
  viewportEl.appendChild(div);
  app.events.on('view-label', (text) => {
    line1.textContent = text;
  });
  const refresh2 = () => {
    const obj = app.mode === 'edit' ? app.editMode.mesh : app.selection.active;
    line2.textContent = obj ? `${app.mode === 'edit' ? '✏ ' : ''}${obj.name}` : '';
  };
  app.events.on('selection-changed', refresh2);
  app.events.on('mode-changed', refresh2);
  app.events.on('objects-changed', refresh2);
  refresh2();
}

// ---------------------------------------------------------------------------

const HINTS_OBJECT =
  '<b>LMB</b> Select · <b>Drag</b> Orbit · <b>Shift+Drag</b> Pan · <b>Wheel</b> Zoom · <b>Shift+A</b> Add · <b>G/R/S</b> Move/Rotate/Scale · <b>Tab</b> Edit Mode · <b>F1</b> Help';
const HINTS_EDIT =
  '<b>LMB</b> Select Vertex · <b>Shift</b> Multi · <b>B</b> Box Select · <b>A</b> All · <b>Alt+A</b> None · <b>G/R/S</b> Transform Verts · <b>Tab</b> Done';
const HINTS_MODAL =
  '<b>LMB/Enter</b> Confirm · <b>RMB/Esc</b> Cancel · <b>X/Y/Z</b> Axis · <b>Shift+Axis</b> Plane · <b>Ctrl</b> Snap · <b>Shift</b> Precise · <b>type numbers</b> Exact';

export class StatusBar {
  constructor(app, el) {
    this.app = app;
    el.innerHTML = '';
    this.hints = document.createElement('div');
    this.hints.className = 'hints';
    this.modalInfo = document.createElement('div');
    this.modalInfo.className = 'modal-info';
    this.flashEl = document.createElement('div');
    this.flashEl.className = 'flash';
    this.stats = document.createElement('div');
    this.stats.className = 'stats';
    el.appendChild(this.hints);
    el.appendChild(this.modalInfo);
    el.appendChild(this.flashEl);
    el.appendChild(this.stats);

    this._flashTimer = null;
    app.events.on('mode-changed', () => this.refresh());
    app.events.on('selection-changed', () => this.refresh());
    app.events.on('objects-changed', () => this.refresh());
    app.events.on('edit-selection-changed', () => this.refresh());
    app.events.on('modal-status', (text) => {
      this.modalText = text;
      this.refresh();
    });
    app.events.on('flash', (msg) => this.flash(msg));
    this.refresh();
  }

  refresh() {
    const app = this.app;
    if (this.modalText) {
      this.hints.innerHTML = HINTS_MODAL;
      this.modalInfo.innerHTML = `<b>${this.modalText}</b>`;
    } else {
      this.modalInfo.textContent = '';
      this.hints.innerHTML = app.mode === 'edit' ? HINTS_EDIT : HINTS_OBJECT;
    }
    if (app.mode === 'edit' && app.editMode.active) {
      this.stats.textContent = app.editMode.countsText();
    } else {
      const n = app.objects.length;
      const s = app.selection.items.length;
      this.stats.textContent = `${n} object${n === 1 ? '' : 's'}${s ? ` · ${s} selected` : ''}`;
    }
  }

  flash(msg) {
    this.flashEl.textContent = msg;
    clearTimeout(this._flashTimer);
    this._flashTimer = setTimeout(() => {
      this.flashEl.textContent = '';
    }, 3000);
  }
}

// ---------------------------------------------------------------------------
// Orientation widget (top-right axis balls). Click a ball to snap the view.
// ---------------------------------------------------------------------------

const AXIS_DEFS = [
  { dir: new THREE.Vector3(1, 0, 0), color: '#e0554f', label: 'X', view: 'right' },
  { dir: new THREE.Vector3(-1, 0, 0), color: '#e0554f', label: '', view: 'left' },
  { dir: new THREE.Vector3(0, 1, 0), color: '#7fa650', label: 'Y', view: 'back' },
  { dir: new THREE.Vector3(0, -1, 0), color: '#7fa650', label: '', view: 'front' },
  { dir: new THREE.Vector3(0, 0, 1), color: '#4a80ff', label: 'Z', view: 'top' },
  { dir: new THREE.Vector3(0, 0, -1), color: '#4a80ff', label: '', view: 'bottom' },
];

export function buildAxisWidget(app, viewportEl) {
  const canvas = document.createElement('canvas');
  canvas.className = 'axis-widget';
  const S = 88;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = S * dpr;
  canvas.height = S * dpr;
  viewportEl.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  const q = new THREE.Quaternion();
  const v = new THREE.Vector3();
  let dots = [];

  const draw = () => {
    const cam = app.viewport.camera;
    q.copy(cam.quaternion).invert();
    const c = S / 2;
    const r = 30;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, S, S);
    dots = AXIS_DEFS.map((d) => {
      v.copy(d.dir).applyQuaternion(q);
      return { ...d, x: c + v.x * r, y: c - v.y * r, z: v.z, positive: d.label !== '' };
    }).sort((a, b) => a.z - b.z);
    for (const d of dots) {
      const fade = 0.55 + 0.45 * ((d.z + 1) / 2);
      if (d.positive) {
        ctx.strokeStyle = d.color;
        ctx.globalAlpha = fade * 0.9;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(c, c);
        ctx.lineTo(d.x, d.y);
        ctx.stroke();
      }
      ctx.globalAlpha = fade;
      ctx.beginPath();
      ctx.arc(d.x, d.y, 7, 0, Math.PI * 2);
      if (d.positive) {
        ctx.fillStyle = d.color;
        ctx.fill();
        ctx.fillStyle = 'rgba(0,0,0,0.75)';
        ctx.font = 'bold 9px system-ui';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(d.label, d.x, d.y + 0.5);
      } else {
        ctx.fillStyle = 'rgba(40,40,40,0.6)';
        ctx.fill();
        ctx.strokeStyle = d.color;
        ctx.lineWidth = 1.4;
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
  };
  app.viewport.onFrame.add(draw);

  canvas.addEventListener('pointerdown', (e) => {
    e.stopPropagation();
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    let best = null;
    let bestD = 12 * 12;
    for (const d of dots) {
      const dd = (d.x - x) ** 2 + (d.y - y) ** 2;
      if (dd < bestD) {
        bestD = dd;
        best = d;
      }
    }
    if (best) app.viewport.viewAxis(best.view);
  });
  return canvas;
}

// ---------------------------------------------------------------------------

export function showHelp() {
  if (document.querySelector('.overlay-backdrop')) return;
  const backdrop = document.createElement('div');
  backdrop.className = 'overlay-backdrop';
  const box = document.createElement('div');
  box.className = 'help-box';
  let html = `<h2>Blender Web</h2><div class="sub">A compact Blender-style 3D editor for the browser. Built with three.js.</div><div class="help-cols">`;
  for (const group of SHORTCUT_GROUPS) {
    html += `<div><h3>${group.title}</h3>`;
    for (const [k, d] of group.items) {
      html += `<div class="help-row"><span class="k">${k}</span><span class="d">${d}</span></div>`;
    }
    html += `</div>`;
  }
  html += `</div>`;
  box.innerHTML = html;
  backdrop.appendChild(box);
  document.body.appendChild(backdrop);
  const close = () => {
    backdrop.remove();
    window.removeEventListener('keydown', onKey, { capture: true });
  };
  const onKey = (e) => {
    if (e.key === 'Escape' || e.key === 'F1') {
      e.preventDefault();
      e.stopPropagation();
      close();
    }
  };
  backdrop.addEventListener('pointerdown', (e) => {
    if (e.target === backdrop) close();
  });
  window.addEventListener('keydown', onKey, { capture: true });
}
