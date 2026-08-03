// Popup menus (menubar dropdowns, Shift+A add menu, RMB context menu).
// Items: { label, shortcut?, action?, children?, sep?, title?, enabled?() }

let stack = []; // [{ el, depth }]
let globalInstalled = false;
let onAllClosed = null;

function installGlobal() {
  if (globalInstalled) return;
  globalInstalled = true;
  window.addEventListener(
    'pointerdown',
    (e) => {
      if (stack.length && !e.target.closest('.ctx-menu')) closeMenus();
    },
    { capture: true }
  );
  window.addEventListener(
    'keydown',
    (e) => {
      if (stack.length && e.key === 'Escape') {
        e.stopPropagation();
        closeMenus();
      }
    },
    { capture: true }
  );
}

export function isMenuOpen() {
  return stack.length > 0;
}

export function closeMenus() {
  for (const m of stack) m.el.remove();
  stack = [];
  if (onAllClosed) {
    const cb = onAllClosed;
    onAllClosed = null;
    cb();
  }
}

function closeFrom(depth) {
  while (stack.length && stack[stack.length - 1].depth >= depth) {
    stack.pop().el.remove();
  }
}

function buildMenu(items, x, y, depth) {
  const el = document.createElement('div');
  el.className = 'ctx-menu';

  for (const it of items) {
    if (it.sep) {
      const s = document.createElement('div');
      s.className = 'menu-sep';
      el.appendChild(s);
      continue;
    }
    if (it.title) {
      const t = document.createElement('div');
      t.className = 'menu-title';
      t.textContent = it.title;
      el.appendChild(t);
      continue;
    }
    const rowEl = document.createElement('div');
    rowEl.className = 'menu-item';
    if (it.enabled && !it.enabled()) rowEl.classList.add('disabled');
    const lab = document.createElement('span');
    lab.className = 'mi-label';
    lab.textContent = it.label;
    rowEl.appendChild(lab);
    if (it.shortcut) {
      const sc = document.createElement('span');
      sc.className = 'shortcut';
      sc.textContent = it.shortcut;
      rowEl.appendChild(sc);
    }
    if (it.children) {
      const ar = document.createElement('span');
      ar.className = 'sub-arrow';
      ar.textContent = '▶';
      rowEl.appendChild(ar);
    }

    rowEl.addEventListener('mouseenter', () => {
      closeFrom(depth + 1);
      if (it.children) {
        const r = rowEl.getBoundingClientRect();
        openAt(it.children, r.right - 2, r.top - 4, depth + 1);
      }
    });
    rowEl.addEventListener('click', (e) => {
      e.stopPropagation();
      if (it.children || !it.action) return;
      closeMenus();
      it.action();
    });
    el.appendChild(rowEl);
  }

  document.body.appendChild(el);
  // clamp into the window
  const r = el.getBoundingClientRect();
  let px = x, py = y;
  if (px + r.width > window.innerWidth - 4) px = Math.max(4, window.innerWidth - r.width - 4);
  if (py + r.height > window.innerHeight - 4) py = Math.max(4, window.innerHeight - r.height - 4);
  el.style.left = `${px}px`;
  el.style.top = `${py}px`;
  return el;
}

function openAt(items, x, y, depth) {
  const el = buildMenu(items, x, y, depth);
  stack.push({ el, depth });
  return el;
}

export function openMenu(items, x, y, opts = {}) {
  installGlobal();
  closeMenus();
  onAllClosed = opts.onClose || null;
  return openAt(items, x, y, 0);
}
