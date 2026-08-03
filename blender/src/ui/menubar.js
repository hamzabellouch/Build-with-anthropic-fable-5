import { MESH_TYPES, LIGHT_TYPES } from '../core/factory.js';
import { SHADING_MODES, SHADING_LABELS } from '../core/scene.js';
import { openMenu, closeMenus } from './menu.js';
import {
  saveJSON, openJSONDialog, importDialog, exportGLB, exportOBJ, exportSTL,
  renderImage, loadDemoScene, recoverAutosave,
} from '../io/importexport.js';
import { showHelp } from './chrome.js';

const SHADING_ICONS = {
  wireframe: `<svg width="14" height="14" viewBox="0 0 14 14"><circle cx="7" cy="7" r="5.4" fill="none" stroke="currentColor"/><path d="M1.6 7 H12.4 M7 1.6 V12.4" stroke="currentColor" fill="none" stroke-width="0.9"/><ellipse cx="7" cy="7" rx="2.6" ry="5.4" fill="none" stroke="currentColor" stroke-width="0.7"/></svg>`,
  solid: `<svg width="14" height="14" viewBox="0 0 14 14"><circle cx="7" cy="7" r="5.6" fill="currentColor"/></svg>`,
  material: `<svg width="14" height="14" viewBox="0 0 14 14"><circle cx="7" cy="7" r="5.6" fill="currentColor"/><path d="M7 1.4 A5.6 5.6 0 0 1 7 12.6 Z" fill="rgba(0,0,0,0.35)"/></svg>`,
  rendered: `<svg width="14" height="14" viewBox="0 0 14 14"><circle cx="7" cy="7" r="5.6" fill="currentColor"/><circle cx="5" cy="5" r="2" fill="rgba(255,255,255,0.85)"/></svg>`,
};

export function addMenuItems(app) {
  return [
    { title: 'Add' },
    {
      label: 'Mesh',
      children: MESH_TYPES.map((t) => ({ label: t.label, action: () => app.addPrimitive(t.id) })),
    },
    {
      label: 'Light',
      children: LIGHT_TYPES.map((t) => ({ label: t.label, action: () => app.addLight(t.id) })),
    },
  ];
}

export function objectMenuItems(app) {
  const hasSel = () => app.selection.items.length > 0;
  const hasMesh = () => app.selection.items.some((o) => o.userData.kind === 'mesh');
  return [
    { label: 'Duplicate', shortcut: 'Shift D', enabled: hasSel, action: () => app.duplicateSelected() },
    { label: 'Delete', shortcut: 'X', enabled: hasSel, action: () => app.deleteSelected() },
    { sep: true },
    { label: 'Shade Smooth', enabled: hasMesh, action: () => app.shadeSmooth(true) },
    { label: 'Shade Flat', enabled: hasMesh, action: () => app.shadeSmooth(false) },
    { sep: true },
    { label: 'Hide Selected', shortcut: 'H', enabled: hasSel, action: () => app.hideSelected() },
    { label: 'Unhide All', shortcut: 'Alt H', action: () => app.unhideAll() },
    { sep: true },
    { label: 'Select All', shortcut: 'A', action: () => app.selectAll(true) },
    { label: 'Deselect All', shortcut: 'Alt A', action: () => app.selectAll(false) },
  ];
}

function fileMenuItems(app) {
  return [
    { label: 'New Scene', shortcut: 'Ctrl N', action: () => app.newScene(true) },
    { label: 'Open…', shortcut: 'Ctrl O', action: () => openJSONDialog(app) },
    { label: 'Save', shortcut: 'Ctrl S', action: () => saveJSON(app) },
    { sep: true },
    { label: 'Import (GLB / OBJ)…', action: () => importDialog(app) },
    {
      label: 'Export',
      children: [
        { label: 'glTF Binary (.glb)', action: () => exportGLB(app) },
        { label: 'Wavefront (.obj)', action: () => exportOBJ(app) },
        { label: 'STL (.stl)', action: () => exportSTL(app) },
      ],
    },
    { sep: true },
    { label: 'Render Image', shortcut: 'F12', action: () => renderImage(app) },
    { sep: true },
    { label: 'Open Demo Scene', action: () => loadDemoScene(app) },
    { label: 'Recover Autosave', action: () => recoverAutosave(app) },
  ];
}

function viewMenuItems(app) {
  const vp = app.viewport;
  return [
    { label: 'Frame Selected', shortcut: 'F', enabled: () => app.selection.items.length > 0, action: () => app.frameSelected() },
    { label: 'Frame All', shortcut: 'Home', action: () => app.frameAll() },
    { sep: true },
    { label: 'Front', shortcut: '1', action: () => vp.viewAxis('front') },
    { label: 'Back', shortcut: 'Ctrl 1', action: () => vp.viewAxis('back') },
    { label: 'Right', shortcut: '3', action: () => vp.viewAxis('right') },
    { label: 'Left', shortcut: 'Ctrl 3', action: () => vp.viewAxis('left') },
    { label: 'Top', shortcut: '7', action: () => vp.viewAxis('top') },
    { label: 'Bottom', shortcut: 'Ctrl 7', action: () => vp.viewAxis('bottom') },
    { sep: true },
    { label: 'Perspective / Orthographic', shortcut: '5', action: () => vp.toggleProjection() },
    { label: 'Reset View', action: () => vp.resetView() },
    { sep: true },
    {
      label: 'Viewport Shading',
      children: SHADING_MODES.map((m) => ({
        label: SHADING_LABELS[m],
        action: () => app.setShading(m),
      })),
    },
  ];
}

function helpMenuItems(app) {
  return [
    { label: 'Keyboard Shortcuts', shortcut: 'F1', action: () => showHelp(app) },
    { sep: true },
    { title: 'Blender Web — built with three.js' },
  ];
}

export function buildMenuBar(app, el) {
  el.innerHTML = '';

  const logo = document.createElement('div');
  logo.className = 'logo';
  logo.innerHTML = `<svg width="16" height="16" viewBox="0 0 16 16"><circle cx="8" cy="8" r="7" fill="#e87d0d"/><circle cx="10" cy="7" r="3.6" fill="#264469"/><circle cx="10" cy="7" r="1.7" fill="#fff"/></svg><span>Blender Web</span>`;
  el.appendChild(logo);

  const menus = [
    ['File', () => fileMenuItems(app)],
    ['Add', () => addMenuItems(app).slice(1)], // no title in dropdown
    ['Object', () => objectMenuItems(app)],
    ['View', () => viewMenuItems(app)],
    ['Help', () => helpMenuItems(app)],
  ];

  let openName = null;
  for (const [name, items] of menus) {
    const btn = document.createElement('button');
    btn.className = 'menubar-btn';
    btn.textContent = name;
    const openIt = () => {
      const r = btn.getBoundingClientRect();
      openName = name;
      btn.classList.add('open');
      openMenu(items(), r.left, r.bottom + 2, {
        onClose: () => {
          btn.classList.remove('open');
          if (openName === name) openName = null;
        },
      });
    };
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      openIt();
    });
    btn.addEventListener('mouseenter', () => {
      if (openName && openName !== name) openIt();
    });
    el.appendChild(btn);
  }

  const spacer = document.createElement('div');
  spacer.className = 'spacer';
  el.appendChild(spacer);

  const pill = document.createElement('div');
  pill.className = 'mode-pill';
  el.appendChild(pill);
  const refreshPill = () => {
    const mode = app.mode === 'edit' ? 'Edit Mode' : 'Object Mode';
    const name = app.mode === 'edit'
      ? app.editMode.mesh?.name
      : app.selection.active?.name;
    pill.innerHTML = `${mode}${name ? `<span class="obj-name">· ${escapeHtml(name)}</span>` : ''}`;
  };

  const shadingGroup = document.createElement('div');
  shadingGroup.className = 'shading-group';
  el.appendChild(shadingGroup);
  const shadingBtns = {};
  for (const m of SHADING_MODES) {
    const b = document.createElement('button');
    b.className = 'shading-btn';
    b.title = `${SHADING_LABELS[m]} (Z cycles)`;
    b.innerHTML = SHADING_ICONS[m];
    b.addEventListener('click', () => app.setShading(m));
    shadingGroup.appendChild(b);
    shadingBtns[m] = b;
  }
  const refreshShading = () => {
    for (const m of SHADING_MODES) shadingBtns[m].classList.toggle('active', app.shading === m);
  };

  app.events.on('mode-changed', refreshPill);
  app.events.on('selection-changed', refreshPill);
  app.events.on('objects-changed', refreshPill);
  app.events.on('shading-changed', refreshShading);
  refreshPill();
  refreshShading();
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export { closeMenus };
