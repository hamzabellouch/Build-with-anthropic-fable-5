/** Settings — appearance, system, storage and about. */
import { h, formatBytes, formatDuration } from '../core/utils';
import { settings } from '../core/settings';
import { vfs } from '../core/vfs';
import { kernel, AppManifest, AppContext, OS_VERSION, OS_CODENAME, KERNEL_VERSION } from '../core/kernel';
import { WALLPAPERS } from '../ui/desktop';
import { icons, logo } from '../icons';
import { confirmDialog } from '../ui/dialogs';
import { notify } from '../ui/notifications';

const ACCENTS = ['#6d8dff', '#38bdf8', '#34d399', '#fbbf24', '#fb7185', '#a78bfa', '#f472b6', '#f97316', '#14b8a6', '#e2e8f0'];

function section(title: string, ...children: Array<HTMLElement | null>): HTMLElement {
  return h('div', { class: 'set-section' }, h('h3', null, title), ...children);
}

function launchSettings(ctx: AppContext) {
  const content = h('div', { class: 'set-content' });

  const pages: Record<string, () => HTMLElement> = {
    appearance: renderAppearance,
    system: renderSystem,
    about: renderAbout,
  };
  const NAV = [
    { id: 'appearance', label: 'Appearance', icon: icons.pictures },
    { id: 'system', label: 'System', icon: icons.settings },
    { id: 'about', label: 'About', icon: icons.info },
  ];

  let active = typeof ctx.args.section === 'string' && pages[ctx.args.section] ? ctx.args.section : 'appearance';

  const nav = h('div', { class: 'set-nav' });
  for (const item of NAV) {
    const b = h('button', { class: 'set-nav-btn', dataset: { id: item.id } },
      h('span', { class: 'set-nav-icon', html: item.icon }),
      h('span', null, item.label),
    );
    b.addEventListener('click', () => show(item.id));
    nav.append(b);
  }

  function show(id: string) {
    active = id;
    nav.querySelectorAll('.set-nav-btn').forEach((el) =>
      el.classList.toggle('active', (el as HTMLElement).dataset.id === id));
    content.innerHTML = '';
    content.append(pages[id]());
  }

  function renderAppearance(): HTMLElement {
    const themeRow = h('div', { class: 'set-theme-row' });
    for (const t of ['dark', 'light'] as const) {
      const card = h('button', { class: `theme-card theme-${t}${settings.get('theme') === t ? ' active' : ''}` },
        h('div', { class: 'theme-card-preview' },
          h('div', { class: 'tc-win' }),
          h('div', { class: 'tc-bar' }),
        ),
        h('span', null, t === 'dark' ? 'Dark' : 'Light'),
      );
      card.addEventListener('click', () => {
        settings.set('theme', t);
        themeRow.querySelectorAll('.theme-card').forEach((el) => el.classList.remove('active'));
        card.classList.add('active');
      });
      themeRow.append(card);
    }

    const accentRow = h('div', { class: 'set-accent-row' });
    const refreshAccents = () => accentRow.querySelectorAll('.accent-dot').forEach((el) =>
      el.classList.toggle('active', (el as HTMLElement).dataset.c === settings.get('accent')));
    for (const c of ACCENTS) {
      const dot = h('button', { class: 'accent-dot', dataset: { c }, style: { background: c }, title: c });
      dot.addEventListener('click', () => { settings.set('accent', c); refreshAccents(); });
      accentRow.append(dot);
    }

    const wallGrid = h('div', { class: 'set-wall-grid' });
    const refreshWalls = () => {
      const wp = settings.get('wallpaper');
      wallGrid.querySelectorAll('.wall-chip').forEach((el) =>
        el.classList.toggle('active', wp.type === 'preset' && (el as HTMLElement).dataset.id === wp.id));
    };
    for (const w of WALLPAPERS) {
      const chip = h('button', { class: `wall-chip wp-${w.id}`, dataset: { id: w.id }, title: w.name });
      chip.addEventListener('click', () => { settings.set('wallpaper', { type: 'preset', id: w.id }); refreshWalls(); });
      wallGrid.append(chip);
    }
    const colorPick = h('input', { type: 'color', value: '#1b2436', class: 'set-color' });
    colorPick.addEventListener('input', () => {
      settings.set('wallpaper', { type: 'color', value: colorPick.value });
      refreshWalls();
    });

    setTimeout(() => { refreshAccents(); refreshWalls(); });
    return h('div', null,
      section('Theme', themeRow),
      section('Accent color', accentRow),
      section('Wallpaper', wallGrid,
        h('div', { class: 'set-row' }, h('label', null, 'Solid color: '), colorPick),
        h('div', { class: 'set-hint' }, 'Tip: right-click an image in Viewer to set it as wallpaper.'),
      ),
    );
  }

  function renderSystem(): HTMLElement {
    const userInput = h('input', { class: 'input', value: settings.get('username'), maxlength: '16' });
    userInput.addEventListener('change', () => {
      const v = userInput.value.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '') || 'user';
      userInput.value = v;
      settings.set('username', v);
      notify({ title: 'Username changed', body: 'New terminals will use the new prompt. (Your old /home folder keeps its name.)', icon: icons.user });
    });
    const hostInput = h('input', { class: 'input', value: settings.get('hostname'), maxlength: '24' });
    hostInput.addEventListener('change', () => {
      const v = hostInput.value.trim().toLowerCase().replace(/[^a-z0-9.-]/g, '') || 'fableos';
      hostInput.value = v;
      settings.set('hostname', v);
    });

    const soundsToggle = h('input', { type: 'checkbox', checked: settings.get('sounds') });
    soundsToggle.addEventListener('change', () => settings.set('sounds', soundsToggle.checked));

    const storageBar = h('div', { class: 'storage-fill' });
    const storageText = h('div', { class: 'set-hint' }, 'calculating…');
    void (async () => {
      const fsBytes = vfs.totalSize();
      let text = `Virtual file system: ${formatBytes(fsBytes)} in ${vfs.countFiles()} files.`;
      try {
        const est = await navigator.storage.estimate();
        if (est.quota) {
          text += ` Browser storage: ${formatBytes(est.usage ?? 0)} of ${formatBytes(est.quota)} quota.`;
          storageBar.style.width = `${Math.max(1, Math.min(100, ((est.usage ?? 0) / est.quota) * 100))}%`;
        }
      } catch { storageBar.style.width = '1%'; }
      storageText.textContent = text;
    })();

    const resetBtn = h('button', { class: 'btn danger' }, 'Reset FableOS…');
    resetBtn.addEventListener('click', async () => {
      const ok = await confirmDialog({
        title: 'Factory reset?',
        body: 'This erases all files, settings and history, then reboots. There is no undo.',
        okText: 'Erase everything', danger: true,
      });
      if (ok) void kernel.resetOS();
    });

    return h('div', null,
      section('Identity',
        h('div', { class: 'set-row' }, h('label', null, 'Username'), userInput),
        h('div', { class: 'set-row' }, h('label', null, 'Hostname'), hostInput),
      ),
      section('Sound',
        h('div', { class: 'set-row' }, h('label', null, 'System sounds'), soundsToggle),
      ),
      section('Storage',
        h('div', { class: 'storage-bar' }, storageBar),
        storageText,
      ),
      section('Danger zone', resetBtn),
    );
  }

  function renderAbout(): HTMLElement {
    const rows: Array<[string, string]> = [
      ['Version', `FableOS ${OS_VERSION} "${OS_CODENAME}"`],
      ['Kernel', KERNEL_VERSION],
      ['Window manager', 'FableWM'],
      ['Shell', 'fsh 1.0'],
      ['Uptime', formatDuration(kernel.uptime())],
      ['Apps installed', String(kernel.listApps().length)],
      ['Host browser', navigator.userAgent.replace(/^Mozilla\/5\.0 /, '')],
      ['Runtime dependencies', '0'],
    ];
    return h('div', null,
      h('div', { class: 'about-hero' },
        h('span', { class: 'about-logo', html: logo }),
        h('div', null,
          h('div', { class: 'about-name' }, 'FableOS'),
          h('div', { class: 'set-hint' }, 'An operating system for your browser. Built from scratch by Fable, an AI by Anthropic.'),
        ),
      ),
      section('Details',
        h('table', { class: 'about-table' },
          ...rows.map(([k, v]) => h('tr', null, h('td', null, k), h('td', null, v))),
        ),
      ),
    );
  }

  ctx.root.append(h('div', { class: 'set' }, nav, content));
  show(active);

  kernel.on('app:args', (proc, args) => {
    const p = proc as { pid: number };
    const a = args as { section?: string };
    if (p.pid === ctx.pid && a.section && pages[a.section]) show(a.section);
  });
}

export const settingsApp: AppManifest = {
  id: 'settings',
  name: 'Settings',
  icon: icons.settings,
  description: 'Appearance, system and storage settings',
  window: { width: 840, height: 560, minWidth: 560, minHeight: 380 },
  launch: launchSettings,
};
