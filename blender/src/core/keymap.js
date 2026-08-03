import { isMenuOpen } from '../ui/menu.js';
import { showHelp } from '../ui/chrome.js';
import { saveJSON, openJSONDialog, renderImage } from '../io/importexport.js';

export const SHORTCUT_GROUPS = [
  {
    title: 'General',
    items: [
      ['Shift A', 'Add object menu'],
      ['X / Delete', 'Delete selected'],
      ['Shift D', 'Duplicate (then move)'],
      ['H / Alt H', 'Hide selected / unhide all'],
      ['F2', 'Rename active object'],
      ['Ctrl Z / Ctrl Shift Z', 'Undo / redo'],
      ['Ctrl S / Ctrl O', 'Save / open scene (.json)'],
      ['F12', 'Render image (PNG)'],
      ['F1', 'This help'],
    ],
  },
  {
    title: 'Selection',
    items: [
      ['Click', 'Select (Shift extends)'],
      ['A / Alt A', 'Select all / none'],
      ['B', 'Box select'],
      ['Right Click', 'Object context menu'],
    ],
  },
  {
    title: 'Transform (modal)',
    items: [
      ['G / R / S', 'Move / rotate / scale'],
      ['X, Y, Z', 'Constrain to axis'],
      ['Shift X/Y/Z', 'Lock axis (plane move)'],
      ['1.5, 90, …', 'Type exact value'],
      ['Ctrl', 'Snap increments'],
      ['Shift', 'Precision mode'],
      ['LMB / Enter', 'Confirm'],
      ['RMB / Esc', 'Cancel'],
    ],
  },
  {
    title: 'View',
    items: [
      ['Drag / Wheel', 'Orbit / zoom'],
      ['Shift Drag', 'Pan'],
      ['1 / 3 / 7', 'Front / right / top (Ctrl = opposite)'],
      ['5', 'Perspective / orthographic'],
      ['F or .', 'Frame selected'],
      ['Home', 'Frame everything'],
      ['Z', 'Cycle viewport shading'],
      ['N / T', 'Toggle sidebar / toolbar'],
    ],
  },
  {
    title: 'Edit Mode',
    items: [
      ['Tab', 'Enter / leave Edit Mode'],
      ['Click / B / A', 'Select vertices'],
      ['G / R / S', 'Transform selected vertices'],
    ],
  },
];

export class Keymap {
  constructor(app) {
    this.app = app;
    window.addEventListener('keydown', (e) => this.onKey(e));
  }

  onKey(e) {
    const app = this.app;
    const t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;

    if (app.modal.active) {
      if (app.modal.handleKey(e)) e.preventDefault();
      return;
    }
    if (isMenuOpen()) return; // menus handle their own keys
    if (app.boxSelect.active) {
      if (e.key === 'Escape') {
        e.preventDefault();
        app.boxSelect.cancel();
      }
      return;
    }

    const k = e.key.toLowerCase();
    const code = e.code;
    const ctrl = e.ctrlKey || e.metaKey;
    const digit = code.startsWith('Digit') ? code.slice(5) : code.startsWith('Numpad') ? code.slice(6) : null;
    const handled = () => e.preventDefault();

    // --- global ---
    if (ctrl && k === 'z' && !e.shiftKey) { app.history.undo(); return handled(); }
    if (ctrl && (k === 'y' || (k === 'z' && e.shiftKey))) { app.history.redo(); return handled(); }
    if (ctrl && k === 's') { saveJSON(app); return handled(); }
    if (ctrl && k === 'o') { openJSONDialog(app); return handled(); }
    if (e.key === 'F1') { showHelp(app); return handled(); }
    if (e.key === 'F12') { renderImage(app); return handled(); }
    if (e.key === 'F2') { app.renameActive(); return handled(); }
    if (e.key === 'Tab' && !ctrl) { app.toggleEditMode(); return handled(); }

    if (!ctrl && !e.altKey) {
      if (k === 'g') { app.modal.start('translate'); return handled(); }
      if (k === 'r') { app.modal.start('rotate'); return handled(); }
      if (k === 's') { app.modal.start('scale'); return handled(); }
      if (k === 'b') { app.boxSelect.start(); return handled(); }
      if (k === 'a' && e.shiftKey) { app.openAddMenuAtPointer(); return handled(); }
      if (k === 'a') { app.selectAll(true); return handled(); }
      if (k === 'd' && e.shiftKey) { app.duplicateSelected(); return handled(); }
      if (k === 'h') { app.hideSelected(); return handled(); }
      if (k === 'x' || e.key === 'Delete') { app.deleteSelected(); return handled(); }
      if (k === 'z') { app.cycleShading(); return handled(); }
      if (k === 'n') { app.toggleSidebar(); return handled(); }
      if (k === 't') { app.toggleToolbar(); return handled(); }
      if (k === 'f' || e.key === '.') { app.frameSelected(); return handled(); }
      if (e.key === 'Home') { app.frameAll(); return handled(); }
      if (k === 'c' && e.shiftKey) { app.frameAll(); return handled(); }
    }
    if (e.altKey && k === 'a') { app.selectAll(false); return handled(); }
    if (e.altKey && k === 'h') { app.unhideAll(); return handled(); }

    if (digit && !e.altKey && !e.shiftKey) {
      if (digit === '1') { app.viewport.viewAxis(ctrl ? 'back' : 'front'); return handled(); }
      if (digit === '3') { app.viewport.viewAxis(ctrl ? 'left' : 'right'); return handled(); }
      if (digit === '7') { app.viewport.viewAxis(ctrl ? 'bottom' : 'top'); return handled(); }
      if (digit === '5' && !ctrl) { app.viewport.toggleProjection(); return handled(); }
    }
  }
}
