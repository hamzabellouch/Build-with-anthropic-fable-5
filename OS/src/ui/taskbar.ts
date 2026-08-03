/** Bottom taskbar: start button, running windows, system tray with clock. */
import { h, formatClock, formatDate } from '../core/utils';
import { wm, OSWindow } from './wm';
import { settings } from '../core/settings';
import { toggleStartMenu, closeStartMenu } from './startmenu';
import { showMenu } from './contextmenu';
import { icons, logo } from '../icons';

const buttons = new Map<OSWindow, HTMLElement>();

function makeTaskButton(win: OSWindow): HTMLElement {
  const btn = h('button', { class: 'task-btn', title: win.title },
    h('span', { class: 'tb-icon', html: win.icon }),
    h('span', { class: 'tb-label' }, win.title),
  );
  btn.addEventListener('click', () => {
    closeStartMenu();
    if (win.minimized) win.focus();
    else if (wm.focused === win) win.minimize();
    else win.focus();
  });
  btn.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    showMenu(e.clientX, e.clientY, [
      { label: win.minimized ? 'Restore' : 'Minimize', icon: icons.minimize, onClick: () => (win.minimized ? win.focus() : win.minimize()) },
      { label: win.maximized ? 'Restore size' : 'Maximize', icon: icons.maximize, onClick: () => win.toggleMaximize() },
      { separator: true },
      { label: 'Close', icon: icons.close, danger: true, onClick: () => void win.close() },
    ]);
  });
  return btn;
}

function refreshActive() {
  for (const [win, btn] of buttons) {
    btn.classList.toggle('active', wm.focused === win && !win.minimized);
    btn.classList.toggle('min', win.minimized);
  }
}

function buildCalendar(): HTMLElement {
  const today = new Date();
  const year = today.getFullYear(), month = today.getMonth();
  const first = new Date(year, month, 1);
  const startDay = (first.getDay() + 6) % 7; // Monday-first
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const grid = h('div', { class: 'cal-grid' });
  for (const d of ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']) {
    grid.append(h('span', { class: 'cal-head' }, d));
  }
  for (let i = 0; i < startDay; i++) grid.append(h('span'));
  for (let d = 1; d <= daysInMonth; d++) {
    grid.append(h('span', { class: `cal-day${d === today.getDate() ? ' today' : ''}` }, String(d)));
  }
  return h('div', { class: 'calendar-pop' },
    h('div', { class: 'cal-title' },
      today.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })),
    grid,
  );
}

export function initTaskbar(root: HTMLElement) {
  const startBtn = h('button', {
    class: 'start-btn', title: 'Start',
    onclick: (e: Event) => { e.stopPropagation(); toggleStartMenu(); },
  }, h('span', { class: 'start-logo', html: logo }));

  const tasks = h('div', { class: 'task-list' });

  const soundBtn = h('button', { class: 'tray-btn', title: 'Toggle sounds', html: settings.get('sounds') ? icons.volume : icons.volumeMute });
  soundBtn.addEventListener('click', () => {
    settings.set('sounds', !settings.get('sounds'));
    soundBtn.innerHTML = settings.get('sounds') ? icons.volume : icons.volumeMute;
  });

  const themeBtn = h('button', { class: 'tray-btn', title: 'Toggle theme', html: settings.get('theme') === 'dark' ? icons.moon : icons.sun });
  themeBtn.addEventListener('click', () => {
    settings.set('theme', settings.get('theme') === 'dark' ? 'light' : 'dark');
    themeBtn.innerHTML = settings.get('theme') === 'dark' ? icons.moon : icons.sun;
  });

  const clockTime = h('span', { class: 'clock-time' });
  const clockDate = h('span', { class: 'clock-date' });
  const clock = h('button', { class: 'clock' }, clockTime, clockDate);
  const tick = () => {
    const d = new Date();
    clockTime.textContent = formatClock(d);
    clockDate.textContent = d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
    clock.title = formatDate(d);
  };
  tick();
  setInterval(tick, 5000);

  let calEl: HTMLElement | null = null;
  clock.addEventListener('click', (e) => {
    e.stopPropagation();
    if (calEl) { calEl.remove(); calEl = null; return; }
    calEl = buildCalendar();
    document.body.append(calEl);
    const closeCal = (ev: PointerEvent) => {
      if (calEl && !calEl.contains(ev.target as Node) && ev.target !== clock && !clock.contains(ev.target as Node)) {
        calEl.remove(); calEl = null;
        document.removeEventListener('pointerdown', closeCal, true);
      }
    };
    document.addEventListener('pointerdown', closeCal, true);
  });

  const showDesktop = h('button', { class: 'show-desktop', title: 'Show desktop', onclick: () => wm.minimizeAll() });

  const bar = h('div', { class: 'taskbar' },
    startBtn,
    tasks,
    h('div', { class: 'tray' }, soundBtn, themeBtn, clock, showDesktop),
  );
  root.append(bar);

  wm.events.on('open', (w) => {
    const win = w as OSWindow;
    const btn = makeTaskButton(win);
    buttons.set(win, btn);
    tasks.append(btn);
    refreshActive();
  });
  wm.events.on('close', (w) => {
    const win = w as OSWindow;
    buttons.get(win)?.remove();
    buttons.delete(win);
    refreshActive();
  });
  wm.events.on('focus', refreshActive);
  wm.events.on('minimize', refreshActive);
  wm.events.on('restore', refreshActive);
  wm.events.on('title', (w) => {
    const win = w as OSWindow;
    const btn = buttons.get(win);
    if (btn) {
      btn.querySelector('.tb-label')!.textContent = win.title;
      btn.title = win.title;
    }
  });
}
