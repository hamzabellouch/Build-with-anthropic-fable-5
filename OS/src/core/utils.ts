/** Tiny DOM + misc utilities shared across the whole OS. */

type Child = Node | string | number | null | undefined | false | Child[];

export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props?: Record<string, unknown> | null,
  ...children: Child[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  if (props) {
    for (const [k, v] of Object.entries(props)) {
      if (v == null || v === false) continue;
      if (k === 'class') el.className = String(v);
      else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
      else if (k.startsWith('on') && typeof v === 'function') {
        el.addEventListener(k.slice(2).toLowerCase(), v as EventListener);
      } else if (k === 'html') el.innerHTML = String(v);
      else if (k === 'dataset' && typeof v === 'object') Object.assign(el.dataset, v);
      else if (k === 'value') (el as unknown as HTMLInputElement).value = String(v);
      else if (k === 'checked') (el as unknown as HTMLInputElement).checked = Boolean(v);
      else if (k === 'disabled') (el as unknown as HTMLButtonElement).disabled = Boolean(v);
      else el.setAttribute(k, String(v));
    }
  }
  appendChildren(el, children);
  return el;
}

function appendChildren(el: HTMLElement, children: Child[]) {
  for (const c of children) {
    if (c == null || c === false) continue;
    if (Array.isArray(c)) appendChildren(el, c);
    else el.append(c instanceof Node ? c : String(c));
  }
}

export const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

export function debounce<A extends unknown[]>(fn: (...args: A) => void, ms: number) {
  let t: ReturnType<typeof setTimeout> | undefined;
  return (...args: A) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

export const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

let uidCounter = 0;
export const uid = () => `id${++uidCounter}_${Date.now().toString(36)}`;

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  const units = ['KB', 'MB', 'GB', 'TB'];
  let i = -1;
  do { n /= 1024; i++; } while (n >= 1024 && i < units.length - 1);
  return `${n.toFixed(n >= 100 ? 0 : 1)} ${units[i]}`;
}

export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));
}

export function formatClock(d: Date, seconds = false): string {
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return seconds ? `${hh}:${mm}:${String(d.getSeconds()).padStart(2, '0')}` : `${hh}:${mm}`;
}

export function formatDate(d: Date): string {
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatDuration(ms: number): string {
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400), hh = Math.floor((s % 86400) / 3600), mm = Math.floor((s % 3600) / 60);
  const parts: string[] = [];
  if (d) parts.push(`${d}d`);
  if (hh) parts.push(`${hh}h`);
  parts.push(`${mm}m ${s % 60}s`);
  return parts.join(' ');
}

/** POSIX-ish path helpers. All VFS paths are absolute and normalized. */
export const Path = {
  normalize(p: string): string {
    const abs = p.startsWith('/');
    const out: string[] = [];
    for (const part of p.split('/')) {
      if (!part || part === '.') continue;
      if (part === '..') out.pop();
      else out.push(part);
    }
    return (abs ? '/' : '') + out.join('/') || (abs ? '/' : '.');
  },
  join(...parts: string[]): string {
    return Path.normalize(parts.filter(Boolean).join('/'));
  },
  resolve(cwd: string, p: string): string {
    if (!p) return cwd;
    return Path.normalize(p.startsWith('/') ? p : cwd + '/' + p);
  },
  dirname(p: string): string {
    const n = Path.normalize(p);
    if (n === '/') return '/';
    const i = n.lastIndexOf('/');
    return i <= 0 ? '/' : n.slice(0, i);
  },
  basename(p: string): string {
    const n = Path.normalize(p);
    return n === '/' ? '/' : n.slice(n.lastIndexOf('/') + 1);
  },
  ext(p: string): string {
    const b = Path.basename(p);
    const i = b.lastIndexOf('.');
    return i > 0 ? b.slice(i + 1).toLowerCase() : '';
  },
};

type Handler = (...args: unknown[]) => void;

export class EventBus {
  private handlers = new Map<string, Set<Handler>>();
  on(ev: string, cb: Handler): () => void {
    if (!this.handlers.has(ev)) this.handlers.set(ev, new Set());
    this.handlers.get(ev)!.add(cb);
    return () => this.handlers.get(ev)?.delete(cb);
  }
  emit(ev: string, ...args: unknown[]) {
    this.handlers.get(ev)?.forEach((cb) => {
      try { cb(...args); } catch (e) { console.error(`[bus:${ev}]`, e); }
    });
  }
}
