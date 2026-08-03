/** Start menu: app launcher with search, user area, and power actions. */
import { h } from '../core/utils';
import { kernel } from '../core/kernel';
import { vfs, homeDir } from '../core/vfs';
import { settings } from '../core/settings';
import { openPath } from '../core/open';
import { icons } from '../icons';
import { lockScreen, showShutdown } from './boot';

let menuEl: HTMLElement | null = null;
let searchInput: HTMLInputElement | null = null;

export function closeStartMenu() {
  if (menuEl) {
    menuEl.classList.add('closing');
    const el = menuEl;
    menuEl = null;
    setTimeout(() => el.remove(), 140);
  }
}

export function toggleStartMenu() {
  if (menuEl) closeStartMenu();
  else openStartMenu();
}

function appTile(app: { id: string; name: string; icon: string }): HTMLElement {
  const tile = h('button', { class: 'sm-tile', title: app.name },
    h('span', { class: 'sm-tile-icon', html: app.icon }),
    h('span', { class: 'sm-tile-label' }, app.name),
  );
  tile.addEventListener('click', () => {
    closeStartMenu();
    void kernel.launch(app.id);
  });
  return tile;
}

function openStartMenu() {
  const grid = h('div', { class: 'sm-grid' });
  const fileResults = h('div', { class: 'sm-files' });

  const renderApps = (query = '') => {
    grid.innerHTML = '';
    fileResults.innerHTML = '';
    const q = query.trim().toLowerCase();
    const apps = kernel.listApps().filter((a) =>
      !q || a.name.toLowerCase().includes(q) || a.id.includes(q) || a.description.toLowerCase().includes(q));
    for (const app of apps) grid.append(appTile(app));
    if (!apps.length) grid.append(h('div', { class: 'sm-empty' }, 'No matching apps'));

    if (q.length >= 2) {
      const paths = vfs.find(q, homeDir(), 8);
      if (paths.length) {
        fileResults.append(h('div', { class: 'sm-files-head' }, 'Files'));
        for (const p of paths) {
          const isDir = vfs.isDir(p);
          const row = h('button', { class: 'sm-file' },
            h('span', { class: 'sm-file-icon', html: isDir ? icons.folder : icons.fileText }),
            h('span', { class: 'sm-file-path' }, p),
          );
          row.addEventListener('click', () => { closeStartMenu(); openPath(p); });
          fileResults.append(row);
        }
      }
    }
  };

  searchInput = h('input', {
    class: 'sm-search', type: 'text', placeholder: 'Search apps and files…',
    oninput: () => renderApps(searchInput!.value),
    onkeydown: (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        const first = (grid.querySelector('.sm-tile') ?? fileResults.querySelector('.sm-file')) as HTMLElement | null;
        first?.click();
      }
    },
  });

  const powerBtn = (title: string, icon: string, fn: () => void) => {
    const b = h('button', { class: 'sm-power-btn', title, html: icon });
    b.addEventListener('click', () => { closeStartMenu(); fn(); });
    return b;
  };

  const footer = h('div', { class: 'sm-footer' },
    h('div', { class: 'sm-user' },
      h('span', { class: 'sm-avatar' }, settings.get('username').charAt(0).toUpperCase()),
      h('span', null, settings.get('username')),
    ),
    h('div', { class: 'sm-power' },
      powerBtn('Lock', icons.lock, () => lockScreen()),
      powerBtn('Restart', icons.restart, () => kernel.reboot()),
      powerBtn('Shut down', icons.power, () => showShutdown()),
    ),
  );

  menuEl = h('div', { class: 'start-menu' },
    h('div', { class: 'sm-search-wrap' }, h('span', { class: 'sm-search-icon', html: icons.search }), searchInput),
    h('div', { class: 'sm-scroll' },
      h('div', { class: 'sm-section-head' }, 'All apps'),
      grid,
      fileResults,
    ),
    footer,
  );
  menuEl.addEventListener('pointerdown', (e) => e.stopPropagation());
  document.body.append(menuEl);
  renderApps();
  searchInput.focus();
}

document.addEventListener('pointerdown', (e) => {
  if (menuEl && !menuEl.contains(e.target as Node) && !(e.target as HTMLElement).closest('.start-btn')) {
    closeStartMenu();
  }
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && menuEl) closeStartMenu();
});
