import * as THREE from 'three';

const MAX_STEPS = 120;

export class History {
  constructor(events) {
    this.events = events;
    this.undoStack = [];
    this.redoStack = [];
  }

  // Record an already-applied command.
  push(cmd) {
    this.undoStack.push(cmd);
    if (this.undoStack.length > MAX_STEPS) this.undoStack.shift();
    this.redoStack = [];
    this.events.emit('history-changed');
  }

  // Apply and record.
  exec(cmd) {
    cmd.redo();
    this.push(cmd);
  }

  undo() {
    const cmd = this.undoStack.pop();
    if (!cmd) return null;
    cmd.undo();
    this.redoStack.push(cmd);
    this.events.emit('history-changed');
    return cmd;
  }

  redo() {
    const cmd = this.redoStack.pop();
    if (!cmd) return null;
    cmd.redo();
    this.undoStack.push(cmd);
    this.events.emit('history-changed');
    return cmd;
  }

  clear() {
    this.undoStack = [];
    this.redoStack = [];
    this.events.emit('history-changed');
  }

  get canUndo() { return this.undoStack.length > 0; }
  get canRedo() { return this.redoStack.length > 0; }
}

// ---------------------------------------------------------------------------
// Commands. Each captures everything it needs at construction time.
// ---------------------------------------------------------------------------

function snapTRS(o) {
  return { p: o.position.clone(), q: o.quaternion.clone(), s: o.scale.clone() };
}

function applyTRS(o, t) {
  o.position.copy(t.p);
  o.quaternion.copy(t.q);
  o.scale.copy(t.s);
}

export class TransformCmd {
  // entries: [{ o, before:{p,q,s}, after:{p,q,s} }]
  constructor(app, entries, label = 'Transform') {
    this.app = app;
    this.entries = entries;
    this.label = label;
  }
  redo() {
    for (const e of this.entries) applyTRS(e.o, e.after);
    this.app.events.emit('transform-changed');
  }
  undo() {
    for (const e of this.entries) applyTRS(e.o, e.before);
    this.app.events.emit('transform-changed');
  }
}

export function captureTransforms(objects) {
  return objects.map((o) => ({ o, before: snapTRS(o), after: null }));
}

export function finalizeTransforms(entries) {
  let changed = false;
  for (const e of entries) {
    e.after = snapTRS(e.o);
    if (
      !e.after.p.equals(e.before.p) ||
      !e.after.q.equals(e.before.q) ||
      !e.after.s.equals(e.before.s)
    )

      changed = true;
  }
  return changed;
}

export class AddObjectsCmd {
  constructor(app, objects, label = 'Add') {
    this.app = app;
    this.objects = [...objects];
    this.label = label;
  }
  redo() {
    for (const o of this.objects) this.app.sceneM.objectsGroup.add(o);
    this.app.afterSceneMutation();
    this.app.selection.set(this.objects);
  }
  undo() {
    for (const o of this.objects) this.app.sceneM.objectsGroup.remove(o);
    this.app.afterSceneMutation();
  }
}

export class DeleteObjectsCmd {
  constructor(app, objects, label = 'Delete') {
    this.app = app;
    this.label = label;
    const group = app.sceneM.objectsGroup;
    this.entries = objects
      .map((o) => ({ o, index: group.children.indexOf(o) }))
      .sort((a, b) => a.index - b.index);
  }
  redo() {
    for (const e of this.entries) this.app.sceneM.objectsGroup.remove(e.o);
    this.app.afterSceneMutation();
  }
  undo() {
    const group = this.app.sceneM.objectsGroup;
    for (const e of this.entries) {
      group.add(e.o);
      // restore original outliner order
      group.children.splice(group.children.indexOf(e.o), 1);
      group.children.splice(Math.min(e.index, group.children.length), 0, e.o);
    }
    this.app.afterSceneMutation();
    this.app.selection.set(this.entries.map((e) => e.o));
  }
}

// Generic property change (material sliders, light settings, names, ...).
export class PropCmd {
  constructor(app, label, applyFn, before, after, refreshEvent = 'objects-changed') {
    this.app = app;
    this.label = label;
    this.applyFn = applyFn;
    this.before = before;
    this.after = after;
    this.refreshEvent = refreshEvent;
  }
  redo() {
    this.applyFn(this.after);
    this.app.events.emit(this.refreshEvent);
  }
  undo() {
    this.applyFn(this.before);
    this.app.events.emit(this.refreshEvent);
  }
}

export class CompositeCmd {
  constructor(label, cmds) {
    this.label = label;
    this.cmds = cmds;
  }
  redo() {
    for (const c of this.cmds) c.redo();
  }
  undo() {
    for (let i = this.cmds.length - 1; i >= 0; i--) this.cmds[i].undo();
  }
}

// Vertex edits: full before/after copies of the position attribute.
export class GeometryCmd {
  constructor(app, mesh, beforeArr, afterArr, label = 'Edit Mesh') {
    this.app = app;
    this.mesh = mesh;
    this.before = beforeArr;
    this.after = afterArr;
    this.label = label;
  }
  _write(arr) {
    const attr = this.mesh.geometry.attributes.position;
    attr.array.set(arr);
    attr.needsUpdate = true;
    this.mesh.geometry.computeVertexNormals();
    this.mesh.geometry.computeBoundingBox();
    this.mesh.geometry.computeBoundingSphere();
    this.mesh.userData.edited = true;
    if (this.app.editMode.active && this.app.editMode.mesh === this.mesh) {
      this.app.editMode.syncFromGeometry();
    }
    this.app.events.emit('transform-changed');
  }
  redo() { this._write(this.after); }
  undo() { this._write(this.before); }
}

// Geometry swapped wholesale (parameter changes, shade smooth/flat).
export class ReplaceGeometryCmd {
  constructor(app, mesh, before, after, label = 'Change Geometry') {
    this.app = app;
    this.mesh = mesh;
    this.before = before; // { geo, params, edited, topo }
    this.after = after;
    this.label = label;
  }
  _apply(state) {
    this.mesh.geometry = state.geo;
    this.mesh.userData.params = { ...state.params };
    this.mesh.userData.edited = state.edited;
    this.mesh.userData.topo = state.topo;
    if (this.app.editMode.active && this.app.editMode.mesh === this.mesh) {
      this.app.editMode.rebuild();
    }
    this.app.events.emit('objects-changed');
    this.app.events.emit('transform-changed');
  }
  redo() { this._apply(this.after); }
  undo() { this._apply(this.before); }
}

export function geometryState(mesh) {
  return {
    geo: mesh.geometry,
    params: { ...mesh.userData.params },
    edited: mesh.userData.edited,
    topo: mesh.userData.topo,
  };
}
