import * as THREE from 'three';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';

// Z-up world, Blender-style. Must be set before any Object3D is constructed.
THREE.Object3D.DEFAULT_UP.set(0, 0, 1);

import { Emitter } from './events.js';
import { SceneManager, SHADING_MODES, SHADING_LABELS } from './scene.js';
import { Viewport } from './viewport.js';
import { Selection } from './selection.js';
import {
  History, AddObjectsCmd, DeleteObjectsCmd, PropCmd, CompositeCmd,
  ReplaceGeometryCmd, geometryState,
} from './history.js';
import { EditMode } from './editmode.js';
import { Keymap } from './keymap.js';
import { createMesh, createLight, cloneObject, uniqueName } from './factory.js';
import { ModalTransform } from '../tools/modal.js';
import { GizmoManager } from '../tools/gizmo.js';
import { BoxSelect } from '../tools/boxselect.js';
import { openMenu } from '../ui/menu.js';
import { buildMenuBar, addMenuItems, objectMenuItems } from '../ui/menubar.js';
import { Outliner } from '../ui/outliner.js';
import { Properties } from '../ui/properties.js';
import { buildToolbar, buildViewportLabel, buildAxisWidget, StatusBar } from '../ui/chrome.js';
import { autosave, installDropImport } from '../io/importexport.js';

export class App {
  constructor() {
    this.events = new Emitter();
    this.mode = 'object'; // 'object' | 'edit'
    this.tool = 'move'; // select | move | rotate | scale
    this.shading = 'solid';

    this.sceneM = new SceneManager();
    this.viewport = new Viewport(document.getElementById('viewport'), this.sceneM, this.events);
    this.selection = new Selection(this.events);
    this.history = new History(this.events);
    this.editMode = new EditMode(this);
    this.modal = new ModalTransform(this);
    this.boxSelect = new BoxSelect(this);
    this.gizmo = new GizmoManager(this);
    this.keymap = new Keymap(this);

    this.sceneM.initEnvironment(this.viewport.renderer);

    // ---- UI ----
    const viewportEl = this.viewport.container;
    buildMenuBar(this, document.getElementById('menubar'));
    this.ui = {
      sidebar: document.getElementById('sidebar'),
      toolbar: buildToolbar(this, viewportEl),
      outliner: new Outliner(this, document.getElementById('outliner')),
      properties: new Properties(this, document.getElementById('properties')),
      statusbar: new StatusBar(this, document.getElementById('statusbar')),
    };
    buildViewportLabel(this, viewportEl);
    buildAxisWidget(this, viewportEl);
    installDropImport(this, viewportEl);

    this._initPointer();

    this.events.on('selection-changed', () => this.updateOutlines());
    this.events.on('mode-changed', () => this.updateOutlines());
    this.events.on('objects-changed', () => this.updateOutlines());

    // autosave (debounced) so work survives accidental reloads
    let saveTimer = null;
    this.events.on('history-changed', () => {
      clearTimeout(saveTimer);
      saveTimer = setTimeout(() => autosave(this), 1500);
    });
    window.addEventListener('beforeunload', () => autosave(this));

    this.newScene(false);
    this.setShading('solid');
    this.viewport.start();

    if (!localStorage.getItem('blender-web.welcomed')) {
      localStorage.setItem('blender-web.welcomed', '1');
      this.flash('Welcome! Shift+A adds objects · F1 shows every shortcut');
    }
  }

  get objects() {
    return this.sceneM.objects;
  }

  // ---- pointer: click select / context menu ------------------------------

  _initPointer() {
    const el = this.viewport.container;
    let down = null;
    el.addEventListener('pointerdown', (e) => {
      if (e.target.closest('.toolbar') || e.target.closest('.axis-widget')) {
        down = null;
        return;
      }
      down = {
        x: e.clientX,
        y: e.clientY,
        button: e.button,
        shift: e.shiftKey,
        gizmo: this.gizmo.isHovering(),
        busy: this.modal.active || this.boxSelect.active,
      };
    });
    el.addEventListener('pointerup', (e) => {
      const d = down;
      down = null;
      if (!d || d.busy || d.gizmo || e.button !== d.button) return;
      if (Math.hypot(e.clientX - d.x, e.clientY - d.y) > 5) return;
      const rect = el.getBoundingClientRect();
      const p = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      if (d.button === 0) this._clickSelect(p, d.shift);
      else if (d.button === 2) this._contextMenu(e.clientX, e.clientY);
    });
    el.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  _clickSelect(p, shift) {
    if (this.mode === 'edit') {
      this.editMode.pickAt(p, shift);
      return;
    }
    const hit = this.pick(p);
    if (!hit) {
      if (!shift) this.selection.clear();
      return;
    }
    if (shift) this.selection.toggle(hit);
    else this.selection.set([hit]);
  }

  _contextMenu(x, y) {
    if (this.mode !== 'object') return;
    openMenu([{ title: 'Object' }, ...objectMenuItems(this)], x, y);
  }

  pick(p) {
    const ray = this.viewport.rayFromScreen(p);
    const hits = ray.intersectObjects(this.objects, true);
    for (const h of hits) {
      let node = h.object;
      let visible = true;
      let top = null;
      while (node && node !== this.sceneM.objectsGroup) {
        if (!node.visible) visible = false;
        top = node;
        node = node.parent;
      }
      if (!node || !visible) continue; // outside object tree, or hidden
      return top;
    }
    return null;
  }

  // ---- object management ---------------------------------------------------

  makeNameUnique(base, except) {
    const names = new Set(this.objects.filter((o) => o !== except).map((o) => o.name));
    return uniqueName(names, base);
  }

  addObjects(objs, label = 'Add') {
    if (!objs.length) return;
    const names = new Set(this.objects.map((o) => o.name));
    for (const o of objs) {
      o.name = uniqueName(names, o.name);
      names.add(o.name);
    }
    if (this.mode === 'edit') this.exitEditMode();
    this.history.exec(new AddObjectsCmd(this, objs, label));
  }

  addPrimitive(id) {
    const mesh = createMesh(id);
    this.addObjects([mesh], `Add ${mesh.name}`);
  }

  addLight(id) {
    const light = createLight(id);
    this.addObjects([light], `Add ${light.name}`);
  }

  deleteSelected() {
    if (this.mode === 'edit') {
      this.flash('Leave Edit Mode (Tab) to delete objects');
      return;
    }
    const items = [...this.selection.items];
    if (!items.length) return;
    this.history.exec(new DeleteObjectsCmd(this, items));
    this.flash(`Deleted ${items.length} object${items.length > 1 ? 's' : ''}`);
  }

  duplicateSelected() {
    if (this.mode !== 'object') return;
    const items = [...this.selection.items];
    if (!items.length) return;
    const clones = items.map((o) => cloneObject(o));
    this.addObjects(clones, 'Duplicate');
    this.modal.start('translate');
  }

  setObjectVisible(obj, v) {
    this.history.exec(new PropCmd(this, v ? 'Show' : 'Hide', (x) => { obj.visible = x; }, obj.visible, v));
  }

  hideSelected() {
    if (this.mode !== 'object') return;
    const items = this.selection.items.filter((o) => o.visible);
    if (!items.length) return;
    const cmds = items.map(
      (o) => new PropCmd(this, 'Hide', (x) => { o.visible = x; }, true, false)
    );
    this.history.exec(new CompositeCmd('Hide', cmds));
    this.events.emit('objects-changed');
  }

  unhideAll() {
    const items = this.objects.filter((o) => !o.visible);
    if (!items.length) return;
    const cmds = items.map(
      (o) => new PropCmd(this, 'Show', (x) => { o.visible = x; }, false, true)
    );
    this.history.exec(new CompositeCmd('Unhide All', cmds));
    this.events.emit('objects-changed');
  }

  selectAll(flag) {
    if (this.mode === 'edit') {
      this.editMode.selectAll(flag);
      return;
    }
    if (flag) this.selection.set(this.objects.filter((o) => o.visible));
    else this.selection.clear();
  }

  renameActive() {
    const obj = this.mode === 'edit' ? this.editMode.mesh : this.selection.active;
    if (obj) this.ui.outliner.startRename(obj);
  }

  // Commands call this after adding/removing scene objects.
  afterSceneMutation() {
    this.selection.prune(this.objects);
    if (this.editMode.active && !this.objects.includes(this.editMode.mesh)) {
      this.exitEditMode();
    }
    // new lights must respect the current shading mode (off in solid/wireframe)
    this.sceneM.applyShading(this.shading);
    this.events.emit('objects-changed');
  }

  // ---- modes / shading / tools ---------------------------------------------

  toggleEditMode() {
    if (this.mode === 'edit') {
      this.exitEditMode();
      return;
    }
    const target = this.selection.active;
    if (!target || target.userData.kind !== 'mesh') {
      this.flash('Select a mesh first, then press Tab');
      return;
    }
    this.mode = 'edit';
    this.editMode.enter(target);
  }

  exitEditMode() {
    if (this.mode !== 'edit') return;
    this.mode = 'object';
    this.editMode.exit();
  }

  setShading(mode) {
    if (!SHADING_MODES.includes(mode)) return;
    this.shading = mode;
    this.sceneM.applyShading(mode);
    // Blender-style view transform: Standard in solid/wireframe, Filmic in lit modes.
    this.viewport.renderer.toneMapping =
      mode === 'material' || mode === 'rendered'
        ? THREE.ACESFilmicToneMapping
        : THREE.NoToneMapping;
    this.events.emit('shading-changed');
    this.flash(`Shading: ${SHADING_LABELS[mode]}`);
  }

  cycleShading() {
    const i = SHADING_MODES.indexOf(this.shading);
    this.setShading(SHADING_MODES[(i + 1) % SHADING_MODES.length]);
  }

  setTool(tool) {
    this.tool = tool;
    this.events.emit('tool-changed');
    this.gizmo.refresh();
  }

  shadeSmooth(smooth) {
    const meshes = this.selection.items.filter((o) => o.userData.kind === 'mesh');
    if (!meshes.length) return;
    const cmds = [];
    for (const mesh of meshes) {
      const before = geometryState(mesh);
      let geo;
      if (smooth) {
        geo = mesh.geometry.clone();
        geo.deleteAttribute('normal');
        geo = mergeVertices(geo, 1e-4);
        geo.computeVertexNormals();
      } else {
        geo = mesh.geometry.index ? mesh.geometry.toNonIndexed() : mesh.geometry.clone();
        geo.computeVertexNormals();
      }
      geo.computeBoundingBox();
      geo.computeBoundingSphere();
      const after = { geo, params: { ...mesh.userData.params }, edited: mesh.userData.edited, topo: true };
      cmds.push(new ReplaceGeometryCmd(this, mesh, before, after, smooth ? 'Shade Smooth' : 'Shade Flat'));
    }
    this.history.exec(new CompositeCmd(smooth ? 'Shade Smooth' : 'Shade Flat', cmds));
    this.flash(smooth ? 'Shade Smooth' : 'Shade Flat');
  }

  // ---- view helpers ----------------------------------------------------------

  frameSelected() {
    if (this.mode === 'edit' && this.editMode.selected.size) {
      const m = this.editMode.mesh.matrixWorld;
      const box = new THREE.Box3();
      const v = new THREE.Vector3();
      for (const id of this.editMode.selected) {
        this.editMode.getLocal(id, v).applyMatrix4(m);
        box.expandByPoint(v);
      }
      box.expandByScalar(0.5);
      this.viewport.frameBox(box);
      return;
    }
    const box = this.selection.worldBox();
    if (box) this.viewport.frameBox(box);
    else this.frameAll();
  }

  frameAll() {
    const box = new THREE.Box3();
    for (const o of this.objects) {
      if (o.visible) box.expandByObject(o);
    }
    if (box.isEmpty()) this.viewport.resetView();
    else this.viewport.frameBox(box);
  }

  toggleSidebar() {
    this.ui.sidebar.classList.toggle('hidden');
    this.viewport.resize();
  }

  toggleToolbar() {
    this.ui.toolbar.style.display = this.ui.toolbar.style.display === 'none' ? '' : 'none';
  }

  updateOutlines() {
    if (this.mode === 'edit') {
      this.viewport.setOutline([], []);
      return;
    }
    const act = this.selection.active;
    this.viewport.setOutline(
      this.selection.items.filter((o) => o !== act),
      act ? [act] : []
    );
  }

  openAddMenuAtPointer() {
    if (this.mode === 'edit') {
      this.flash('Leave Edit Mode (Tab) to add objects');
      return;
    }
    const lp = this.viewport.lastPointer;
    const rect = this.viewport.container.getBoundingClientRect();
    const x = lp.clientX || rect.left + rect.width / 2;
    const y = lp.clientY || rect.top + rect.height / 3;
    openMenu(addMenuItems(this), x, y);
  }

  flash(msg) {
    this.events.emit('flash', msg);
  }

  // ---- scene lifecycle ---------------------------------------------------------

  clearScene() {
    this.exitEditMode();
    if (this.modal.active) this.modal.cancel();
    const group = this.sceneM.objectsGroup;
    for (const o of [...group.children]) {
      group.remove(o);
      o.traverse((c) => {
        c.geometry?.dispose?.();
        if (c.material) {
          for (const m of Array.isArray(c.material) ? c.material : [c.material]) m.dispose();
        }
      });
    }
    this.selection.clear();
    this.history.clear();
    this.events.emit('objects-changed');
  }

  newScene(confirmFirst = true) {
    if (confirmFirst && this.objects.length) {
      if (!window.confirm('Start a new scene? Unsaved changes will be lost.')) return;
    }
    this.clearScene();

    const cube = createMesh('cube');
    this.sceneM.objectsGroup.add(cube);
    const light = createLight('point');
    light.position.set(4.1, 1.0, 5.9);
    this.sceneM.objectsGroup.add(light);

    this.setShading(this.shading === 'rendered' || this.shading === 'material' ? this.shading : 'solid');
    this.viewport.resetView();
    this.afterSceneMutation();
    this.selection.set([cube]);
    this.history.clear();
  }
}
