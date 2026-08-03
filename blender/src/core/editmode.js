import * as THREE from 'three';

const COL_UNSEL = new THREE.Color('#101010');
const COL_SEL = new THREE.Color('#ff9a2d');

// Vertex Edit Mode. Vertices duplicated in the buffer (per-face normals/uvs)
// are welded into "unique" vertices by position so moving a cube corner moves
// all of its copies, like Blender.
export class EditMode {
  constructor(app) {
    this.app = app;
    this.active = false;
    this.mesh = null;
    this.selected = new Set();
  }

  enter(mesh) {
    if (this.active) this.exit();
    this.mesh = mesh;
    this.active = true;
    this.selected = new Set();
    this._build();
    this.app.events.emit('mode-changed');
  }

  exit() {
    if (!this.active) return;
    this._disposeOverlays();
    this.active = false;
    this.mesh = null;
    this.selected = new Set();
    this.app.events.emit('mode-changed');
  }

  _build() {
    const geo = this.mesh.geometry;
    const pos = geo.attributes.position;

    // Weld by position (1e-4 tolerance).
    const map = new Map();
    this.groups = [];
    const unique = [];
    this.vertOfAttr = new Uint32Array(pos.count);
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
      const key = `${Math.round(x * 1e4)},${Math.round(y * 1e4)},${Math.round(z * 1e4)}`;
      let id = map.get(key);
      if (id === undefined) {
        id = this.groups.length;
        map.set(key, id);
        this.groups.push([]);
        unique.push(x, y, z);
      }
      this.groups[id].push(i);
      this.vertOfAttr[i] = id;
    }
    this.count = this.groups.length;
    this.unique = new Float32Array(unique);

    // Topology edges between unique verts.
    const edgeSet = new Set();
    const edges = [];
    const addEdge = (a, b) => {
      const lo = Math.min(a, b), hi = Math.max(a, b);
      const key = lo * this.count + hi;
      if (!edgeSet.has(key)) {
        edgeSet.add(key);
        edges.push(lo, hi);
      }
    };
    const index = geo.index;
    const triCount = index ? index.count / 3 : pos.count / 3;
    for (let t = 0; t < triCount; t++) {
      const a = this.vertOfAttr[index ? index.getX(t * 3) : t * 3];
      const b = this.vertOfAttr[index ? index.getX(t * 3 + 1) : t * 3 + 1];
      const c = this.vertOfAttr[index ? index.getX(t * 3 + 2) : t * 3 + 2];
      addEdge(a, b);
      addEdge(b, c);
      addEdge(c, a);
    }

    // Shared position attribute -> wires and points update together.
    this.uniqueAttr = new THREE.BufferAttribute(this.unique, 3);

    const dpr = this.app.viewport.dpr;
    const pointsGeo = new THREE.BufferGeometry();
    pointsGeo.setAttribute('position', this.uniqueAttr);
    this.colors = new Float32Array(this.count * 3);
    this.colorAttr = new THREE.BufferAttribute(this.colors, 3);
    pointsGeo.setAttribute('color', this.colorAttr);
    this.points = new THREE.Points(
      pointsGeo,
      new THREE.PointsMaterial({
        size: 6 * dpr,
        sizeAttenuation: false,
        vertexColors: true,
        depthTest: false,
        transparent: true,
      })
    );
    this.points.frustumCulled = false;
    this.points.renderOrder = 999;
    this.points.userData.isEditOverlay = true;
    this.points.raycast = () => {}; // picking is done in screen space

    const linesGeo = new THREE.BufferGeometry();
    linesGeo.setAttribute('position', this.uniqueAttr);
    linesGeo.setIndex(edges);
    this.lines = new THREE.LineSegments(
      linesGeo,
      new THREE.LineBasicMaterial({ color: 0xcfcfcf, transparent: true, opacity: 0.35, depthTest: false })
    );
    this.lines.frustumCulled = false;
    this.lines.renderOrder = 998;
    this.lines.userData.isEditOverlay = true;
    this.lines.raycast = () => {};

    this.mesh.add(this.points);
    this.mesh.add(this.lines);
    this.refreshColors();
  }

  _disposeOverlays() {
    for (const o of [this.points, this.lines]) {
      if (!o) continue;
      this.mesh.remove(o);
      o.geometry.dispose();
      o.material.dispose();
    }
    this.points = null;
    this.lines = null;
  }

  // Rebuild after geometry was replaced (params change / shade smooth).
  rebuild() {
    if (!this.active) return;
    this._disposeOverlays();
    this._build();
    this.app.events.emit('edit-selection-changed');
  }

  // Re-read unique positions after an undo/redo wrote the position attribute.
  syncFromGeometry() {
    if (!this.active) return;
    const pos = this.mesh.geometry.attributes.position;
    for (let id = 0; id < this.count; id++) {
      const i = this.groups[id][0];
      this.unique[id * 3] = pos.getX(i);
      this.unique[id * 3 + 1] = pos.getY(i);
      this.unique[id * 3 + 2] = pos.getZ(i);
    }
    this.uniqueAttr.needsUpdate = true;
  }

  refreshColors() {
    for (let id = 0; id < this.count; id++) {
      const c = this.selected.has(id) ? COL_SEL : COL_UNSEL;
      this.colors[id * 3] = c.r;
      this.colors[id * 3 + 1] = c.g;
      this.colors[id * 3 + 2] = c.b;
    }
    this.colorAttr.needsUpdate = true;
    this.app.events.emit('edit-selection-changed');
  }

  getLocal(id, v = new THREE.Vector3()) {
    return v.fromArray(this.unique, id * 3);
  }

  setLocal(id, v) {
    this.unique[id * 3] = v.x;
    this.unique[id * 3 + 1] = v.y;
    this.unique[id * 3 + 2] = v.z;
    const pos = this.mesh.geometry.attributes.position;
    for (const i of this.groups[id]) pos.setXYZ(i, v.x, v.y, v.z);
  }

  commitBatch() {
    const geo = this.mesh.geometry;
    geo.attributes.position.needsUpdate = true;
    this.uniqueAttr.needsUpdate = true;
    geo.computeVertexNormals();
    geo.computeBoundingBox();
    geo.computeBoundingSphere();
  }

  positionSnapshot() {
    return new Float32Array(this.mesh.geometry.attributes.position.array);
  }

  // ---- screen-space selection ----------------------------------------------

  _projectAll() {
    this.mesh.updateWorldMatrix(true, false);
    const m = this.mesh.matrixWorld;
    const v = new THREE.Vector3();
    const out = new Array(this.count);
    for (let id = 0; id < this.count; id++) {
      v.fromArray(this.unique, id * 3).applyMatrix4(m);
      out[id] = this.app.viewport.project(v, {});
    }
    return out;
  }

  pickAt(p, additive) {
    const pts = this._projectAll();
    let best = -1;
    let bestD = 12 * 12;
    for (let id = 0; id < this.count; id++) {
      const s = pts[id];
      if (s.behind) continue;
      const dx = s.x - p.x, dy = s.y - p.y;
      const d = dx * dx + dy * dy;
      if (d < bestD) {
        bestD = d;
        best = id;
      }
    }
    if (best === -1) {
      if (!additive && this.selected.size) {
        this.selected.clear();
        this.refreshColors();
      }
      return false;
    }
    if (additive) {
      if (this.selected.has(best)) this.selected.delete(best);
      else this.selected.add(best);
    } else {
      this.selected = new Set([best]);
    }
    this.refreshColors();
    return true;
  }

  selectRect(rect, additive) {
    const pts = this._projectAll();
    if (!additive) this.selected.clear();
    const x0 = Math.min(rect.x0, rect.x1), x1 = Math.max(rect.x0, rect.x1);
    const y0 = Math.min(rect.y0, rect.y1), y1 = Math.max(rect.y0, rect.y1);
    for (let id = 0; id < this.count; id++) {
      const s = pts[id];
      if (s.behind) continue;
      if (s.x >= x0 && s.x <= x1 && s.y >= y0 && s.y <= y1) this.selected.add(id);
    }
    this.refreshColors();
  }

  selectAll(flag) {
    if (flag) {
      this.selected = new Set(Array.from({ length: this.count }, (_, i) => i));
    } else {
      this.selected.clear();
    }
    this.refreshColors();
  }

  medianWorld() {
    if (!this.selected.size) return null;
    this.mesh.updateWorldMatrix(true, false);
    const m = this.mesh.matrixWorld;
    const acc = new THREE.Vector3();
    const v = new THREE.Vector3();
    for (const id of this.selected) {
      v.fromArray(this.unique, id * 3).applyMatrix4(m);
      acc.add(v);
    }
    return acc.divideScalar(this.selected.size);
  }

  countsText() {
    return `${this.count} verts · ${this.selected.size} selected`;
  }
}
