/**
 * FableWM — the FableOS window manager.
 * Draggable, resizable, snappable windows with minimize/maximize/focus
 * handling and open/close animations.
 */
import { EventBus, clamp, h } from '../core/utils';
import { icons } from '../icons';

export interface WindowOpts {
  title: string;
  icon?: string;
  width?: number;
  height?: number;
  x?: number;
  y?: number;
  minWidth?: number;
  minHeight?: number;
  resizable?: boolean;
  onBeforeClose?: () => boolean | Promise<boolean>;
}

interface Bounds { x: number; y: number; w: number; h: number }

const TASKBAR_H = 48;
let zCounter = 100;
let cascade = 0;
let winId = 0;

export class OSWindow {
  id = ++winId;
  el: HTMLElement;
  content: HTMLElement;
  title: string;
  icon: string;
  minimized = false;
  maximized = false;
  closed = false;
  bounds: Bounds;
  private restoreBounds: Bounds | null = null;
  private titleEl: HTMLElement;
  private maxBtn: HTMLElement;
  onBeforeClose?: () => boolean | Promise<boolean>;

  constructor(private wmRef: WindowManager, opts: WindowOpts) {
    this.title = opts.title;
    this.icon = opts.icon ?? icons.file;
    this.onBeforeClose = opts.onBeforeClose;

    const vw = window.innerWidth, vh = window.innerHeight - TASKBAR_H;
    const w = clamp(opts.width ?? 720, 240, vw - 16);
    const hgt = clamp(opts.height ?? 480, 160, vh - 16);
    const cx = 60 + (cascade % 8) * 32;
    const cy = 40 + (cascade % 8) * 26;
    cascade++;
    const x = opts.x ?? clamp(Math.round((vw - w) / 2) + (cx - 160), 8, Math.max(8, vw - w - 8));
    const y = opts.y ?? clamp(cy, 8, Math.max(8, vh - hgt - 8));
    this.bounds = { x, y, w, h: hgt };

    this.titleEl = h('span', { class: 'win-title' }, this.title);
    this.maxBtn = h('button', {
      class: 'win-btn', title: 'Maximize', html: icons.maximize,
      onclick: () => this.toggleMaximize(),
    });
    const titlebar = h('div', { class: 'titlebar' },
      h('span', { class: 'win-icon', html: this.icon }),
      this.titleEl,
      h('div', { class: 'win-btns' },
        h('button', { class: 'win-btn', title: 'Minimize', html: icons.minimize, onclick: () => this.minimize() }),
        this.maxBtn,
        h('button', { class: 'win-btn win-close', title: 'Close', html: icons.close, onclick: () => void this.close() }),
      ),
    );
    titlebar.addEventListener('dblclick', (e) => {
      if (!(e.target as HTMLElement).closest('.win-btn')) this.toggleMaximize();
    });

    this.content = h('div', { class: 'win-content' });
    this.el = h('div', { class: 'window opening' }, titlebar, this.content);
    this.applyBounds();
    this.el.style.zIndex = String(++zCounter);

    if (opts.resizable !== false) {
      for (const dirn of ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw']) {
        const handle = h('div', { class: `rs rs-${dirn}` });
        this.attachResize(handle, dirn, opts.minWidth ?? 280, opts.minHeight ?? 160);
        this.el.append(handle);
      }
    } else {
      this.maxBtn.style.display = 'none';
    }

    this.attachDrag(titlebar);
    this.el.addEventListener('pointerdown', () => this.focus(), { capture: true });
    requestAnimationFrame(() => requestAnimationFrame(() => this.el.classList.remove('opening')));
  }

  private applyBounds() {
    const { x, y, w, h: hgt } = this.bounds;
    this.el.style.left = `${x}px`;
    this.el.style.top = `${y}px`;
    this.el.style.width = `${w}px`;
    this.el.style.height = `${hgt}px`;
  }

  setTitle(t: string) {
    this.title = t;
    this.titleEl.textContent = t;
    this.wmRef.events.emit('title', this);
  }

  focus() {
    if (this.closed) return;
    if (this.minimized) this.restore();
    if (this.wmRef.focused === this) return;
    this.wmRef.setFocus(this);
    this.el.style.zIndex = String(++zCounter);
  }

  minimize() {
    if (this.minimized || this.closed) return;
    this.minimized = true;
    this.el.classList.add('minimizing');
    setTimeout(() => {
      if (this.minimized) this.el.classList.add('minimized');
      this.el.classList.remove('minimizing');
    }, 180);
    if (this.wmRef.focused === this) this.wmRef.focusTopmost(this);
    this.wmRef.events.emit('minimize', this);
  }

  restore() {
    if (!this.minimized || this.closed) return;
    this.minimized = false;
    this.el.classList.remove('minimized');
    this.wmRef.events.emit('restore', this);
  }

  toggleMaximize() {
    if (this.maximized) this.unmaximize();
    else this.maximize();
  }

  maximize() {
    if (this.maximized) return;
    this.restoreBounds = { ...this.bounds };
    this.maximized = true;
    this.el.classList.add('maximized');
    this.maxBtn.innerHTML = icons.restore;
    this.maxBtn.title = 'Restore';
    this.focus();
  }

  unmaximize() {
    if (!this.maximized) return;
    this.maximized = false;
    this.el.classList.remove('maximized');
    this.maxBtn.innerHTML = icons.maximize;
    this.maxBtn.title = 'Maximize';
    if (this.restoreBounds) { this.bounds = { ...this.restoreBounds }; this.applyBounds(); }
  }

  /** Snap to a half of the screen (used by edge snapping). */
  snapTo(side: 'left' | 'right') {
    if (this.maximized) this.unmaximize();
    if (!this.restoreBounds) this.restoreBounds = { ...this.bounds };
    const vw = window.innerWidth, vh = window.innerHeight - TASKBAR_H;
    this.bounds = { x: side === 'left' ? 0 : Math.floor(vw / 2), y: 0, w: Math.floor(vw / 2), h: vh };
    this.applyBounds();
  }

  async close(force = false) {
    if (this.closed) return;
    if (!force && this.onBeforeClose) {
      const ok = await this.onBeforeClose();
      if (!ok) return;
    }
    this.closed = true;
    this.el.classList.add('closing');
    setTimeout(() => this.el.remove(), 160);
    this.wmRef.unregister(this);
  }

  private attachDrag(titlebar: HTMLElement) {
    titlebar.addEventListener('pointerdown', (e: PointerEvent) => {
      if (e.button !== 0 || (e.target as HTMLElement).closest('.win-btn')) return;
      e.preventDefault();
      const startX = e.clientX, startY = e.clientY;
      let dragging = false;
      let grabOffX = e.clientX - this.bounds.x;
      const grabOffY = e.clientY - this.bounds.y;
      let snap: 'left' | 'right' | 'top' | null = null;

      const onMove = (ev: PointerEvent) => {
        if (!dragging && Math.abs(ev.clientX - startX) + Math.abs(ev.clientY - startY) < 4) return;
        if (!dragging) {
          dragging = true;
          document.body.classList.add('wm-dragging');
          if (this.maximized) {
            const ratio = (ev.clientX - this.bounds.x) / this.el.offsetWidth;
            this.unmaximize();
            grabOffX = this.bounds.w * clamp(ratio, 0.1, 0.9);
          }
        }
        this.bounds.x = ev.clientX - grabOffX;
        this.bounds.y = clamp(ev.clientY - grabOffY, 0, window.innerHeight - TASKBAR_H - 36);
        this.applyBounds();

        const vw = window.innerWidth;
        snap = ev.clientY <= 4 ? 'top' : ev.clientX <= 4 ? 'left' : ev.clientX >= vw - 5 ? 'right' : null;
        this.wmRef.showSnapPreview(snap);
      };
      const onUp = () => {
        titlebar.removeEventListener('pointermove', onMove);
        titlebar.releasePointerCapture?.(pid);
        document.body.classList.remove('wm-dragging');
        this.wmRef.showSnapPreview(null);
        if (snap === 'top') this.maximize();
        else if (snap) this.snapTo(snap);
      };
      const pid = e.pointerId;
      titlebar.setPointerCapture(pid);
      titlebar.addEventListener('pointermove', onMove);
      titlebar.addEventListener('pointerup', onUp, { once: true });
      titlebar.addEventListener('pointercancel', onUp, { once: true });
    });
  }

  private attachResize(handle: HTMLElement, dirn: string, minW: number, minH: number) {
    handle.addEventListener('pointerdown', (e: PointerEvent) => {
      if (e.button !== 0 || this.maximized) return;
      e.preventDefault();
      e.stopPropagation();
      this.focus();
      const start = { ...this.bounds };
      const sx = e.clientX, sy = e.clientY;
      document.body.classList.add('wm-dragging');

      const onMove = (ev: PointerEvent) => {
        const dx = ev.clientX - sx, dy = ev.clientY - sy;
        const b = { ...start };
        if (dirn.includes('e')) b.w = Math.max(minW, start.w + dx);
        if (dirn.includes('s')) b.h = Math.max(minH, start.h + dy);
        if (dirn.includes('w')) {
          b.w = Math.max(minW, start.w - dx);
          b.x = start.x + (start.w - b.w);
        }
        if (dirn.includes('n')) {
          b.h = Math.max(minH, start.h - dy);
          b.y = clamp(start.y + (start.h - b.h), 0, window.innerHeight);
        }
        this.bounds = b;
        this.applyBounds();
      };
      const onUp = () => {
        handle.removeEventListener('pointermove', onMove);
        handle.releasePointerCapture?.(e.pointerId);
        document.body.classList.remove('wm-dragging');
      };
      handle.setPointerCapture(e.pointerId);
      handle.addEventListener('pointermove', onMove);
      handle.addEventListener('pointerup', onUp, { once: true });
      handle.addEventListener('pointercancel', onUp, { once: true });
    });
  }
}

class WindowManager {
  events = new EventBus();
  windows: OSWindow[] = [];
  focused: OSWindow | null = null;
  private layer!: HTMLElement;
  private snapPreview!: HTMLElement;

  init(layer: HTMLElement) {
    this.layer = layer;
    this.snapPreview = h('div', { class: 'snap-preview' });
    layer.append(this.snapPreview);
  }

  create(opts: WindowOpts): OSWindow {
    const win = new OSWindow(this, opts);
    this.windows.push(win);
    this.layer.append(win.el);
    this.events.emit('open', win);
    this.setFocus(win);
    return win;
  }

  setFocus(win: OSWindow) {
    if (this.focused === win) return;
    this.focused?.el.classList.remove('focused');
    this.focused = win;
    win.el.classList.add('focused');
    this.events.emit('focus', win);
  }

  /** Focus the highest non-minimized window, skipping `except`. */
  focusTopmost(except?: OSWindow) {
    const candidates = this.windows
      .filter((w) => w !== except && !w.minimized && !w.closed)
      .sort((a, b) => Number(b.el.style.zIndex) - Number(a.el.style.zIndex));
    this.focused = null;
    if (candidates[0]) candidates[0].focus();
    else this.events.emit('focus', null);
  }

  unregister(win: OSWindow) {
    this.windows = this.windows.filter((w) => w !== win);
    this.events.emit('close', win);
    if (this.focused === win) this.focusTopmost();
  }

  minimizeAll() {
    this.windows.forEach((w) => w.minimize());
  }

  showSnapPreview(side: 'left' | 'right' | 'top' | null) {
    if (!side) { this.snapPreview.className = 'snap-preview'; return; }
    this.snapPreview.className = `snap-preview visible snap-${side}`;
  }
}

export const wm = new WindowManager();
