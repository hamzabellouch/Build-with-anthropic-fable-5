import { PropCmd } from '../core/history.js';

const ICONS = {
  mesh: `<svg width="12" height="12" viewBox="0 0 12 12"><path d="M6 1 L11 3.6 V8.4 L6 11 L1 8.4 V3.6 Z" fill="none" stroke="currentColor"/><path d="M1 3.6 L6 6.2 L11 3.6 M6 6.2 V11" stroke="currentColor" fill="none"/></svg>`,
  light: `<svg width="12" height="12" viewBox="0 0 12 12"><circle cx="6" cy="6" r="2.4" fill="none" stroke="currentColor"/><path d="M6 0.5 V2.2 M6 9.8 V11.5 M0.5 6 H2.2 M9.8 6 H11.5 M2.2 2.2 L3.4 3.4 M8.6 8.6 L9.8 9.8 M9.8 2.2 L8.6 3.4 M3.4 8.6 L2.2 9.8" stroke="currentColor"/></svg>`,
};

const EYE_ON = `<svg width="13" height="13" viewBox="0 0 13 13"><path d="M1 6.5 C2.6 3.8 4.4 2.6 6.5 2.6 C8.6 2.6 10.4 3.8 12 6.5 C10.4 9.2 8.6 10.4 6.5 10.4 C4.4 10.4 2.6 9.2 1 6.5 Z" fill="none" stroke="currentColor"/><circle cx="6.5" cy="6.5" r="1.8" fill="currentColor"/></svg>`;
const EYE_OFF = `<svg width="13" height="13" viewBox="0 0 13 13"><path d="M1 6.5 C2.6 3.8 4.4 2.6 6.5 2.6 C8.6 2.6 10.4 3.8 12 6.5 C10.4 9.2 8.6 10.4 6.5 10.4 C4.4 10.4 2.6 9.2 1 6.5 Z" fill="none" stroke="currentColor" opacity="0.5"/><path d="M2 11 L11 2" stroke="currentColor"/></svg>`;

export class Outliner {
  constructor(app, el) {
    this.app = app;
    this.el = el;
    this._renaming = null;
    const rebuild = () => this.rebuild();
    app.events.on('objects-changed', rebuild);
    app.events.on('selection-changed', rebuild);
    app.events.on('mode-changed', rebuild);
    this.rebuild();
  }

  rebuild() {
    const app = this.app;
    this.el.innerHTML = '';
    if (!app.objects.length) {
      const empty = document.createElement('div');
      empty.className = 'outliner-empty';
      empty.innerHTML = 'Scene is empty<br><kbd>Shift</kbd>+<kbd>A</kbd> to add objects';
      this.el.appendChild(empty);
      return;
    }
    for (const obj of app.objects) {
      this.el.appendChild(this._row(obj));
    }
  }

  _row(obj) {
    const app = this.app;
    const row = document.createElement('div');
    row.className = 'outliner-row';
    if (app.selection.has(obj)) row.classList.add('selected');
    if (app.selection.active === obj) row.classList.add('active');
    if (!obj.visible) row.classList.add('hidden-obj');

    const icon = document.createElement('span');
    icon.className = 'icon';
    icon.innerHTML = ICONS[obj.userData.kind] || ICONS.mesh;
    row.appendChild(icon);

    const name = document.createElement('span');
    name.className = 'name';
    name.textContent = obj.name;
    row.appendChild(name);

    const eye = document.createElement('button');
    eye.className = 'eye' + (obj.visible ? '' : ' off');
    eye.innerHTML = obj.visible ? EYE_ON : EYE_OFF;
    eye.title = 'Hide / show';
    eye.addEventListener('click', (e) => {
      e.stopPropagation();
      app.setObjectVisible(obj, !obj.visible);
    });
    row.appendChild(eye);

    row.addEventListener('click', (e) => {
      if (this._renaming === obj) return;
      if (app.mode === 'edit') app.exitEditMode();
      if (e.shiftKey) app.selection.toggle(obj);
      else app.selection.set([obj]);
    });
    row.addEventListener('dblclick', () => this.startRename(obj, name));
    return row;
  }

  startRename(obj, nameEl) {
    if (!nameEl) {
      this.rebuild();
      const rows = [...this.el.querySelectorAll('.outliner-row')];
      const idx = this.app.objects.indexOf(obj);
      nameEl = rows[idx]?.querySelector('.name');
      if (!nameEl) return;
    }
    this._renaming = obj;
    const app = this.app;
    const input = document.createElement('input');
    input.value = obj.name;
    input.spellcheck = false;
    nameEl.textContent = '';
    nameEl.appendChild(input);
    input.focus();
    input.select();
    let finished = false;
    const done = (apply) => {
      if (finished) return;
      finished = true;
      this._renaming = null;
      const newName = input.value.trim();
      if (apply && newName && newName !== obj.name) {
        const before = obj.name;
        const after = app.makeNameUnique(newName, obj);
        app.history.exec(new PropCmd(app, 'Rename', (v) => { obj.name = v; }, before, after));
      } else {
        this.rebuild();
      }
    };
    input.addEventListener('keydown', (e) => {
      e.stopPropagation();
      if (e.key === 'Enter') done(true);
      if (e.key === 'Escape') done(false);
    });
    input.addEventListener('blur', () => done(true));
  }
}
