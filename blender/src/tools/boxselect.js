import * as THREE from 'three';

// B-key box select. In Object Mode it tests projected bounding boxes;
// in Edit Mode it selects vertices inside the rectangle.
export class BoxSelect {
  constructor(app) {
    this.app = app;
    this.active = false;
    this.rect = null;
    this._onDown = (e) => this.onDown(e);
    this._onMove = (e) => this.onMove(e);
    this._onUp = (e) => this.onUp(e);
    this._drawer = (ctx) => this.draw(ctx);
  }

  start() {
    if (this.active || this.app.modal.active) return;
    this.active = true;
    this.rect = null;
    this.app.viewport.controls.enabled = false;
    window.addEventListener('pointerdown', this._onDown, { capture: true });
    window.addEventListener('pointermove', this._onMove);
    window.addEventListener('pointerup', this._onUp);
    this.app.viewport.overlayDrawers.add(this._drawer);
    this.app.events.emit('modal-status', 'Box Select  —  drag LMB, Esc to cancel');
  }

  _local(e) {
    const r = this.app.viewport.container.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  onDown(e) {
    if (e.button !== 0) {
      this.end();
      return;
    }
    e.preventDefault();
    e.stopImmediatePropagation();
    const p = this._local(e);
    this.rect = { x0: p.x, y0: p.y, x1: p.x, y1: p.y, additive: e.shiftKey };
  }

  onMove(e) {
    if (!this.rect) return;
    const p = this._local(e);
    this.rect.x1 = p.x;
    this.rect.y1 = p.y;
  }

  onUp(e) {
    if (!this.rect) return;
    e.preventDefault();
    const rect = this.rect;
    this.end();
    if (Math.abs(rect.x1 - rect.x0) < 3 && Math.abs(rect.y1 - rect.y0) < 3) return;
    if (this.app.mode === 'edit') {
      this.app.editMode.selectRect(rect, rect.additive);
    } else {
      this._selectObjects(rect);
    }
  }

  _selectObjects(rect) {
    const app = this.app;
    const x0 = Math.min(rect.x0, rect.x1), x1 = Math.max(rect.x0, rect.x1);
    const y0 = Math.min(rect.y0, rect.y1), y1 = Math.max(rect.y0, rect.y1);
    const picked = [];
    const box = new THREE.Box3();
    const v = new THREE.Vector3();
    for (const o of app.objects) {
      if (!o.visible) continue;
      box.setFromObject(o);
      if (box.isEmpty()) continue;
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      let anyFront = false;
      for (let i = 0; i < 8; i++) {
        v.set(
          i & 1 ? box.max.x : box.min.x,
          i & 2 ? box.max.y : box.min.y,
          i & 4 ? box.max.z : box.min.z
        );
        const s = app.viewport.project(v, {});
        if (!s.behind) anyFront = true;
        minX = Math.min(minX, s.x); maxX = Math.max(maxX, s.x);
        minY = Math.min(minY, s.y); maxY = Math.max(maxY, s.y);
      }
      if (anyFront && maxX >= x0 && minX <= x1 && maxY >= y0 && minY <= y1) picked.push(o);
    }
    if (rect.additive) {
      if (picked.length) app.selection.addMany(picked);
    } else {
      app.selection.set(picked);
    }
  }

  cancel() {
    this.end();
  }

  end() {
    if (!this.active) return;
    this.active = false;
    this.rect = null;
    window.removeEventListener('pointerdown', this._onDown, { capture: true });
    window.removeEventListener('pointermove', this._onMove);
    window.removeEventListener('pointerup', this._onUp);
    this.app.viewport.overlayDrawers.delete(this._drawer);
    this.app.viewport.controls.enabled = !this.app.modal.active;
    this.app.events.emit('modal-status', null);
  }

  draw(ctx) {
    if (!this.rect) return;
    const { x0, y0, x1, y1 } = this.rect;
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(Math.min(x0, x1) + 0.5, Math.min(y0, y1) + 0.5, Math.abs(x1 - x0), Math.abs(y1 - y0));
    ctx.fillStyle = 'rgba(120,160,255,0.08)';
    ctx.fillRect(Math.min(x0, x1), Math.min(y0, y1), Math.abs(x1 - x0), Math.abs(y1 - y0));
    ctx.restore();
  }
}
