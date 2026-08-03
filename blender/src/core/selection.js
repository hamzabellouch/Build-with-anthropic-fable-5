import * as THREE from 'three';

// Object-mode selection. `items` is ordered; `active` is the last-clicked
// object (shown brighter, used for Edit Mode / properties), like Blender.
export class Selection {
  constructor(events) {
    this.events = events;
    this.items = [];
    this.active = null;
  }

  _changed() {
    this.events.emit('selection-changed');
  }

  has(obj) {
    return this.items.includes(obj);
  }

  set(objects, active) {
    this.items = [...objects];
    this.active = active !== undefined ? active : (this.items[this.items.length - 1] || null);
    this._changed();
  }

  clear() {
    if (!this.items.length && !this.active) return;
    this.items = [];
    this.active = null;
    this._changed();
  }

  // Shift-click behaviour: add if absent (becomes active); if already active,
  // remove it; if present but not active, make it active.
  toggle(obj) {
    if (!this.has(obj)) {
      this.items.push(obj);
      this.active = obj;
    } else if (this.active === obj) {
      this.items = this.items.filter((o) => o !== obj);
      this.active = this.items[this.items.length - 1] || null;
    } else {
      this.active = obj;
    }
    this._changed();
  }

  addMany(objects) {
    let changed = false;
    for (const o of objects) {
      if (!this.has(o)) {
        this.items.push(o);
        changed = true;
      }
    }
    if (objects.length) this.active = objects[objects.length - 1];
    if (changed || objects.length) this._changed();
  }

  // Drop references to objects no longer in the scene.
  prune(validList) {
    const valid = new Set(validList);
    const before = this.items.length;
    this.items = this.items.filter((o) => valid.has(o));
    if (this.active && !valid.has(this.active)) {
      this.active = this.items[this.items.length - 1] || null;
    }
    if (this.items.length !== before) this._changed();
  }

  median(target = new THREE.Vector3()) {
    if (!this.items.length) return null;
    target.set(0, 0, 0);
    const v = new THREE.Vector3();
    for (const o of this.items) {
      o.getWorldPosition(v);
      target.add(v);
    }
    return target.divideScalar(this.items.length);
  }

  worldBox() {
    if (!this.items.length) return null;
    const box = new THREE.Box3();
    for (const o of this.items) box.expandByObject(o);
    return box.isEmpty() ? null : box;
  }
}
