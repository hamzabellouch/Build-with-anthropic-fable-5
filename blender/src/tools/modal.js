import * as THREE from 'three';
import { TransformCmd, GeometryCmd } from '../core/history.js';

const AXIS_VECS = {
  x: new THREE.Vector3(1, 0, 0),
  y: new THREE.Vector3(0, 1, 0),
  z: new THREE.Vector3(0, 0, 1),
};
const AXIS_COLORS = { x: 0xe0554f, y: 0x7fa650, z: 0x4a80ff };
const MODE_LABEL = { translate: 'Move', rotate: 'Rotate', scale: 'Scale' };

function shortestAngle(d) {
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

// Parameter along the axis line (through `pivot`) closest to `ray`.
function axisParam(ray, pivot, axis) {
  const w0 = new THREE.Vector3().subVectors(pivot, ray.origin);
  const b = axis.dot(ray.direction);
  const d = axis.dot(w0);
  const e = ray.direction.dot(w0);
  const denom = 1 - b * b;
  if (Math.abs(denom) < 1e-6) return null;
  return (b * e - d) / denom;
}

// ---------------------------------------------------------------------------

class ObjectsAdapter {
  constructor(app) {
    this.app = app;
    this.items = app.selection.items.map((o) => ({
      o,
      p: o.position.clone(),
      q: o.quaternion.clone(),
      s: o.scale.clone(),
    }));
  }

  get empty() { return this.items.length === 0; }

  pivot() {
    const v = new THREE.Vector3();
    for (const it of this.items) v.add(it.p);
    return v.divideScalar(this.items.length);
  }

  applyTranslate(delta) {
    for (const it of this.items) it.o.position.copy(it.p).add(delta);
  }

  applyRotate(q, pivot) {
    for (const it of this.items) {
      it.o.position.copy(it.p).sub(pivot).applyQuaternion(q).add(pivot);
      it.o.quaternion.copy(q).multiply(it.q);
    }
  }

  applyScale(svec, pivot) {
    for (const it of this.items) {
      it.o.position.set(
        pivot.x + (it.p.x - pivot.x) * svec.x,
        pivot.y + (it.p.y - pivot.y) * svec.y,
        pivot.z + (it.p.z - pivot.z) * svec.z
      );
      it.o.scale.set(it.s.x * svec.x, it.s.y * svec.y, it.s.z * svec.z);
    }
  }

  restore() {
    for (const it of this.items) {
      it.o.position.copy(it.p);
      it.o.quaternion.copy(it.q);
      it.o.scale.copy(it.s);
    }
  }

  finish(label) {
    const entries = [];
    let changed = false;
    for (const it of this.items) {
      const before = { p: it.p, q: it.q, s: it.s };
      const after = { p: it.o.position.clone(), q: it.o.quaternion.clone(), s: it.o.scale.clone() };
      if (!after.p.equals(before.p) || !after.q.equals(before.q) || !after.s.equals(before.s)) changed = true;
      entries.push({ o: it.o, before, after });
    }
    if (changed) this.app.history.push(new TransformCmd(this.app, entries, label));
  }
}

class VertsAdapter {
  constructor(app) {
    this.app = app;
    this.em = app.editMode;
    this.ids = [...this.em.selected];
    if (!this.ids.length) return;
    this.before = this.em.positionSnapshot();
    this.em.mesh.updateWorldMatrix(true, false);
    this.matrix = this.em.mesh.matrixWorld.clone();
    this.inv = this.matrix.clone().invert();
    this.start = new Float32Array(this.ids.length * 3);
    const v = new THREE.Vector3();
    for (let k = 0; k < this.ids.length; k++) {
      this.em.getLocal(this.ids[k], v);
      v.toArray(this.start, k * 3);
    }
  }

  get empty() { return this.ids.length === 0; }

  pivot() {
    const acc = new THREE.Vector3();
    const v = new THREE.Vector3();
    for (let k = 0; k < this.ids.length; k++) {
      v.fromArray(this.start, k * 3).applyMatrix4(this.matrix);
      acc.add(v);
    }
    return acc.divideScalar(this.ids.length);
  }

  _eachWorld(fn) {
    const v = new THREE.Vector3();
    for (let k = 0; k < this.ids.length; k++) {
      v.fromArray(this.start, k * 3).applyMatrix4(this.matrix);
      fn(v);
      v.applyMatrix4(this.inv);
      this.em.setLocal(this.ids[k], v);
    }
    this.em.commitBatch();
  }

  applyTranslate(delta) {
    this._eachWorld((v) => v.add(delta));
  }

  applyRotate(q, pivot) {
    this._eachWorld((v) => v.sub(pivot).applyQuaternion(q).add(pivot));
  }

  applyScale(svec, pivot) {
    this._eachWorld((v) => {
      v.sub(pivot);
      v.x *= svec.x; v.y *= svec.y; v.z *= svec.z;
      v.add(pivot);
    });
  }

  restore() {
    const attr = this.em.mesh.geometry.attributes.position;
    attr.array.set(this.before);
    attr.needsUpdate = true;
    this.em.mesh.geometry.computeVertexNormals();
    this.em.mesh.geometry.computeBoundingBox();
    this.em.mesh.geometry.computeBoundingSphere();
    this.em.syncFromGeometry();
  }

  finish(label) {
    const after = this.em.positionSnapshot();
    let changed = false;
    for (let i = 0; i < after.length; i++) {
      if (after[i] !== this.before[i]) { changed = true; break; }
    }
    if (changed) {
      this.em.mesh.userData.edited = true;
      this.app.history.push(new GeometryCmd(this.app, this.em.mesh, this.before, after, label));
    }
  }
}

// ---------------------------------------------------------------------------
// Blender-style modal transform: G/R/S, then X/Y/Z (Shift+axis = plane lock),
// typed numbers for exact values, Shift = precision, Ctrl = snap,
// LMB/Enter confirm, RMB/Esc cancel.
// ---------------------------------------------------------------------------

export class ModalTransform {
  constructor(app) {
    this.app = app;
    this.active = false;
    this._onMove = (e) => this.onPointerMove(e);
    this._onDown = (e) => this.onPointerDown(e);
    this._drawer = (ctx) => this.drawOverlay(ctx);
    this.axisHelper = null;
  }

  start(mode) {
    if (this.active) return;
    const app = this.app;
    const adapter = app.mode === 'edit' ? new VertsAdapter(app) : new ObjectsAdapter(app);
    if (adapter.empty) {
      app.flash(app.mode === 'edit' ? 'No vertices selected' : 'Nothing selected');
      return;
    }
    this.adapter = adapter;
    this.mode = mode;
    this.active = true;
    this.axis = null;
    this.plane = false;
    this.numeric = '';
    this.shift = false;
    this.ctrl = false;
    this._initFromCurrentPointer(true);

    app.viewport.controls.enabled = false;
    app.gizmo.setModalActive(true);
    window.addEventListener('pointermove', this._onMove);
    window.addEventListener('pointerdown', this._onDown, { capture: true });
    app.viewport.overlayDrawers.add(this._drawer);
    this.apply();
    this.updateStatus();
  }

  _initFromCurrentPointer(resetPointer) {
    const vp = this.app.viewport;
    this.pivot = this.adapter.pivot();
    this.anchor = vp.project(this.pivot, {});
    if (resetPointer) {
      const { w, h } = vp.size();
      const lp = vp.lastPointer;
      this.pointer = lp.x || lp.y ? { x: lp.x, y: lp.y } : { x: w / 2, y: h * 0.35 };
    }
    this.startPointer = { ...this.pointer };
    this.dist0 = Math.max(Math.hypot(this.startPointer.x - this.anchor.x, this.startPointer.y - this.anchor.y), 30);
    this.acc = { t: 0, vec: new THREE.Vector3(), angle: 0, scale: 1 };
    this.lastRaw = this.sampleRaw(this.pointer);
    this.current = null;
  }

  sampleRaw(p) {
    const vp = this.app.viewport;
    if (this.mode === 'translate') {
      const ray = vp.rayFromScreen(p).ray;
      if (this.axis && !this.plane) {
        const t = axisParam(ray, this.pivot, AXIS_VECS[this.axis]);
        return { t: t !== null ? t : (this.lastRaw?.t ?? 0) };
      }
      const n = this.plane && this.axis
        ? AXIS_VECS[this.axis].clone()
        : vp.camera.getWorldDirection(new THREE.Vector3());
      const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(n, this.pivot);
      const hit = new THREE.Vector3();
      if (!ray.intersectPlane(plane, hit)) {
        return this.lastRaw && this.lastRaw.p ? { p: this.lastRaw.p.clone() } : { p: this.pivot.clone() };
      }
      return { p: hit };
    }
    if (this.mode === 'rotate') {
      return { angle: Math.atan2(-(p.y - this.anchor.y), p.x - this.anchor.x) };
    }
    return { d: Math.max(Math.hypot(p.x - this.anchor.x, p.y - this.anchor.y), 2) };
  }

  onPointerMove(e) {
    this.shift = e.shiftKey;
    this.ctrl = e.ctrlKey;
    const r = this.app.viewport.container.getBoundingClientRect();
    const p = { x: e.clientX - r.left, y: e.clientY - r.top };
    this.pointer = p;
    if (this.numeric === '') {
      const raw = this.sampleRaw(p);
      const f = this.shift ? 0.1 : 1;
      if (this.mode === 'translate') {
        if (this.axis && !this.plane) {
          this.acc.t += (raw.t - this.lastRaw.t) * f;
        } else if (raw.p && this.lastRaw.p) {
          this.acc.vec.addScaledVector(new THREE.Vector3().subVectors(raw.p, this.lastRaw.p), f);
        }
      } else if (this.mode === 'rotate') {
        this.acc.angle += shortestAngle(raw.angle - this.lastRaw.angle) * f;
      } else {
        this.acc.scale += ((raw.d - this.lastRaw.d) / this.dist0) * f;
      }
      this.lastRaw = raw;
    }
    this.apply();
    this.updateStatus();
  }

  onPointerDown(e) {
    e.preventDefault();
    e.stopImmediatePropagation();
    if (e.button === 2) this.cancel();
    else if (e.button === 0) this.confirm();
  }

  numericValue() {
    if (this.numeric === '' || this.numeric === '-' || this.numeric === '.') return null;
    const v = parseFloat(this.numeric);
    return Number.isFinite(v) ? v : null;
  }

  apply() {
    const nv = this.numericValue();
    if (this.mode === 'translate') {
      let delta;
      if (nv !== null && this.axis && !this.plane) {
        delta = AXIS_VECS[this.axis].clone().multiplyScalar(nv);
      } else if (this.axis && !this.plane) {
        delta = AXIS_VECS[this.axis].clone().multiplyScalar(this.acc.t);
      } else {
        delta = this.acc.vec.clone();
      }
      if (this.ctrl && nv === null) {
        const step = this.shift ? 0.1 : 1;
        delta.x = Math.round(delta.x / step) * step;
        delta.y = Math.round(delta.y / step) * step;
        delta.z = Math.round(delta.z / step) * step;
      }
      this.adapter.applyTranslate(delta);
      this.current = { delta };
    } else if (this.mode === 'rotate') {
      const vp = this.app.viewport;
      const viewOut = vp.camera.getWorldDirection(new THREE.Vector3()).negate();
      let axisVec, angle;
      if (nv !== null) {
        angle = THREE.MathUtils.degToRad(nv);
        axisVec = this.axis ? AXIS_VECS[this.axis].clone() : viewOut;
      } else {
        angle = this.acc.angle;
        if (this.ctrl) {
          const stepDeg = this.shift ? 1 : 5;
          angle = THREE.MathUtils.degToRad(
            Math.round(THREE.MathUtils.radToDeg(angle) / stepDeg) * stepDeg
          );
        }
        if (this.axis) {
          axisVec = AXIS_VECS[this.axis].clone();
          if (axisVec.dot(viewOut) < 0) angle = -angle;
        } else {
          axisVec = viewOut;
        }
      }
      const q = new THREE.Quaternion().setFromAxisAngle(axisVec, angle);
      this.adapter.applyRotate(q, this.pivot);
      this.current = { angle, axisVec };
    } else {
      let s = nv !== null ? nv : this.acc.scale;
      if (this.ctrl && nv === null) {
        const step = this.shift ? 0.01 : 0.1;
        s = Math.round(s / step) * step;
      }
      const svec = new THREE.Vector3(1, 1, 1);
      if (this.axis && !this.plane) {
        svec[this.axis] = s;
      } else if (this.axis && this.plane) {
        svec.set(s, s, s);
        svec[this.axis] = 1;
      } else {
        svec.set(s, s, s);
      }
      this.adapter.applyScale(svec, this.pivot);
      this.current = { svec };
    }
    this.app.events.emit('transform-changed');
  }

  setAxis(a, shiftPlane) {
    const plane = !!shiftPlane && this.mode !== 'rotate';
    if (this.axis === a && this.plane === plane) {
      this.axis = null;
      this.plane = false;
    } else {
      this.axis = a;
      this.plane = plane;
    }
    if (this.mode === 'translate' && this.numeric === '') {
      // Re-derive the accumulated delta under the new constraint.
      const base = this.sampleRaw(this.startPointer);
      const cur = this.sampleRaw(this.pointer);
      if (this.axis && !this.plane) {
        this.acc.t = (cur.t ?? 0) - (base.t ?? 0);
      } else if (cur.p && base.p) {
        this.acc.vec.subVectors(cur.p, base.p);
      }
      this.lastRaw = cur;
    }
    this._updateAxisHelper();
    this.apply();
    this.updateStatus();
  }

  switchMode(mode) {
    this.adapter.restore();
    this.mode = mode;
    this.axis = null;
    this.plane = false;
    this.numeric = '';
    this._updateAxisHelper();
    this._initFromCurrentPointer(false);
    this.apply();
    this.updateStatus();
  }

  _updateAxisHelper() {
    const helpers = this.app.sceneM.helpersGroup;
    if (this.axisHelper) {
      helpers.remove(this.axisHelper);
      this.axisHelper.traverse((o) => {
        o.geometry?.dispose();
        o.material?.dispose();
      });
      this.axisHelper = null;
    }
    if (!this.axis) return;
    const group = new THREE.Group();
    group.userData.isTransformHelper = true;
    const axes = this.plane
      ? Object.keys(AXIS_VECS).filter((k) => k !== this.axis)
      : [this.axis];
    for (const k of axes) {
      const dir = AXIS_VECS[k];
      const geo = new THREE.BufferGeometry().setFromPoints([
        this.pivot.clone().addScaledVector(dir, -1000),
        this.pivot.clone().addScaledVector(dir, 1000),
      ]);
      const line = new THREE.Line(
        geo,
        new THREE.LineBasicMaterial({
          color: AXIS_COLORS[k],
          transparent: true,
          opacity: 0.8,
          depthTest: false,
        })
      );
      line.renderOrder = 997;
      group.add(line);
    }
    helpers.add(group);
    this.axisHelper = group;
  }

  handleKey(e) {
    const k = e.key.toLowerCase();
    if (e.key === 'Enter') { this.confirm(); return true; }
    if (e.key === 'Escape') { this.cancel(); return true; }
    if (k === 'x' || k === 'y' || k === 'z') { this.setAxis(k, e.shiftKey); return true; }
    if (k === 'g' || k === 'r' || k === 's') {
      const m = { g: 'translate', r: 'rotate', s: 'scale' }[k];
      if (m !== this.mode) this.switchMode(m);
      return true;
    }
    if (/^[0-9.]$/.test(e.key)) {
      if (this.mode === 'translate' && (!this.axis || this.plane)) {
        this.axis = 'x';
        this.plane = false;
        this._updateAxisHelper();
      }
      if (e.key === '.' && this.numeric.includes('.')) return true;
      this.numeric += e.key;
      this.apply();
      this.updateStatus();
      return true;
    }
    if (e.key === '-') {
      this.numeric = this.numeric.startsWith('-') ? this.numeric.slice(1) : '-' + this.numeric;
      this.apply();
      this.updateStatus();
      return true;
    }
    if (e.key === 'Backspace') {
      this.numeric = this.numeric.slice(0, -1);
      this.apply();
      this.updateStatus();
      return true;
    }
    if (e.key === 'Tab') return true; // swallow
    return false;
  }

  updateStatus() {
    const f = (n) => (Math.abs(n) >= 100 ? n.toFixed(2) : n.toFixed(4)).replace(/0+$/, '0');
    let text = '';
    if (this.mode === 'translate' && this.current?.delta) {
      const d = this.current.delta;
      text = `Move  Δ ${f(d.x)}, ${f(d.y)}, ${f(d.z)}`;
    } else if (this.mode === 'rotate' && this.current) {
      text = `Rotate  ${THREE.MathUtils.radToDeg(this.current.angle).toFixed(2)}°`;
    } else if (this.current?.svec) {
      const s = this.current.svec;
      text = `Scale  ${f(s.x)}, ${f(s.y)}, ${f(s.z)}`;
    }
    if (this.axis) {
      text += this.plane ? `  [${this.axis.toUpperCase()} plane lock]` : `  along ${this.axis.toUpperCase()}`;
    }
    if (this.numeric !== '') text += `  ⌨ ${this.numeric}`;
    this.app.events.emit('modal-status', text);
  }

  drawOverlay(ctx) {
    if (this.mode !== 'rotate') return;
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.65)';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(this.anchor.x, this.anchor.y);
    ctx.lineTo(this.pointer.x, this.pointer.y);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.arc(this.anchor.x, this.anchor.y, 3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  confirm() {
    if (!this.active) return;
    this.adapter.finish(MODE_LABEL[this.mode]);
    this._end();
  }

  cancel() {
    if (!this.active) return;
    this.adapter.restore();
    this.app.events.emit('transform-changed');
    this._end();
  }

  _end() {
    this.active = false;
    window.removeEventListener('pointermove', this._onMove);
    window.removeEventListener('pointerdown', this._onDown, { capture: true });
    this.app.viewport.overlayDrawers.delete(this._drawer);
    this.axis = null;
    this.plane = false;
    this._updateAxisHelper();
    this.app.viewport.controls.enabled = true;
    this.app.gizmo.setModalActive(false);
    this.app.events.emit('modal-status', null);
    this.app.events.emit('transform-changed');
  }
}
