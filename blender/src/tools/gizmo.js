import * as THREE from 'three';
import { TransformControls } from 'three/addons/controls/TransformControls.js';
import { TransformCmd } from '../core/history.js';

const TOOL_TO_MODE = { move: 'translate', rotate: 'rotate', scale: 'scale' };

// Viewport gizmo (toolbar Move/Rotate/Scale). The gizmo drives an invisible
// proxy at the selection median; deltas are fanned out to every selected
// object so multi-selection behaves like Blender.
export class GizmoManager {
  constructor(app) {
    this.app = app;
    this.tc = new TransformControls(app.viewport.camera, app.viewport.renderer.domElement);
    this.tc.setSize(0.85);
    const helper = this.tc.getHelper();
    helper.userData.isTransformHelper = true;
    app.sceneM.scene.add(helper);
    this.helper = helper;

    this.proxy = new THREE.Object3D();
    this.proxy.name = 'GizmoProxy';
    app.sceneM.helpersGroup.add(this.proxy);

    this._drag = null;
    this._modal = false;

    this.tc.addEventListener('dragging-changed', (e) => {
      this.app.viewport.controls.enabled = !e.value;
      if (e.value) this._beginDrag();
      else this._endDrag();
    });
    this.tc.addEventListener('objectChange', () => this._onObjectChange());

    app.events.on('camera-swapped', (cam) => {
      this.tc.camera = cam;
    });
    app.events.on('selection-changed', () => this.refresh());
    app.events.on('objects-changed', () => this.refresh());
    app.events.on('mode-changed', () => this.refresh());
    app.events.on('transform-changed', () => {
      if (!this.tc.dragging) this.refresh();
    });
  }

  isHovering() {
    return this.tc.axis !== null && this.helper.visible;
  }

  setModalActive(flag) {
    this._modal = flag;
    this.refresh();
  }

  refresh() {
    const app = this.app;
    if (this.tc.dragging) return;
    const mode = TOOL_TO_MODE[app.tool];
    const usable = mode && app.mode === 'object' && app.selection.items.length > 0 && !this._modal;
    if (!usable) {
      this.tc.detach();
      this.tc.enabled = false;
      this.helper.visible = false;
      return;
    }
    const median = app.selection.median();
    this.proxy.position.copy(median);
    this.proxy.quaternion.identity();
    this.proxy.scale.set(1, 1, 1);
    this.tc.setMode(mode);
    this.tc.attach(this.proxy);
    this.tc.enabled = true;
    this.helper.visible = true;
  }

  _beginDrag() {
    this._drag = {
      items: this.app.selection.items.map((o) => ({
        o,
        p: o.position.clone(),
        q: o.quaternion.clone(),
        s: o.scale.clone(),
      })),
      pivot: this.proxy.position.clone(),
      qInv: this.proxy.quaternion.clone().invert(),
    };
  }

  _onObjectChange() {
    const st = this._drag;
    if (!st) return;
    const mode = this.tc.mode;
    if (mode === 'translate') {
      const delta = this.proxy.position.clone().sub(st.pivot);
      for (const it of st.items) it.o.position.copy(it.p).add(delta);
    } else if (mode === 'rotate') {
      const qd = this.proxy.quaternion.clone().multiply(st.qInv);
      for (const it of st.items) {
        it.o.position.copy(it.p).sub(st.pivot).applyQuaternion(qd).add(st.pivot);
        it.o.quaternion.copy(qd).multiply(it.q);
      }
    } else {
      const sv = this.proxy.scale;
      for (const it of st.items) {
        it.o.position.set(
          st.pivot.x + (it.p.x - st.pivot.x) * sv.x,
          st.pivot.y + (it.p.y - st.pivot.y) * sv.y,
          st.pivot.z + (it.p.z - st.pivot.z) * sv.z
        );
        it.o.scale.set(it.s.x * sv.x, it.s.y * sv.y, it.s.z * sv.z);
      }
    }
    this.app.events.emit('transform-changed');
  }

  _endDrag() {
    const st = this._drag;
    this._drag = null;
    if (!st) return;
    const entries = [];
    let changed = false;
    for (const it of st.items) {
      const before = { p: it.p, q: it.q, s: it.s };
      const after = { p: it.o.position.clone(), q: it.o.quaternion.clone(), s: it.o.scale.clone() };
      if (!after.p.equals(before.p) || !after.q.equals(before.q) || !after.s.equals(before.s)) changed = true;
      entries.push({ o: it.o, before, after });
    }
    if (changed) this.app.history.push(new TransformCmd(this.app, entries, 'Transform'));
    this.refresh();
  }
}
