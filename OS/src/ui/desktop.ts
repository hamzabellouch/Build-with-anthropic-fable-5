/** The desktop surface: wallpaper, desktop icons, selection, context menu. */
import { h, Path, debounce } from '../core/utils';
import { vfs, homeDir } from '../core/vfs';
import { settings, Wallpaper } from '../core/settings';
import { kernel } from '../core/kernel';
import { openPath, entryIcon, entryLabel } from '../core/open';
import { showMenu } from './contextmenu';
import { promptDialog, confirmDialog } from './dialogs';
import { icons } from '../icons';

export const WALLPAPERS: Array<{ id: string; name: string }> = [
  { id: 'aurora', name: 'Aurora' },
  { id: 'dusk', name: 'Dusk' },
  { id: 'ocean', name: 'Ocean' },
  { id: 'forest', name: 'Forest' },
  { id: 'sunrise', name: 'Sunrise' },
  { id: 'graphite', name: 'Graphite' },
  { id: 'candy', name: 'Candy' },
  { id: 'mesh', name: 'Mesh' },
];

let wallEl: HTMLElement;
let iconsEl: HTMLElement;

const desktopDir = () => `${homeDir()}/Desktop`;

export function applyWallpaper(wp: Wallpaper = settings.get('wallpaper')) {
  wallEl.className = 'wallpaper';
  wallEl.style.background = '';
  wallEl.style.backgroundSize = '';
  if (wp.type === 'preset') {
    wallEl.classList.add(`wp-${wp.id}`);
  } else if (wp.type === 'color') {
    wallEl.style.background = wp.value;
  } else {
    const url = wp.value.startsWith('data:')
      ? wp.value
      : 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(wp.value);
    wallEl.style.background = `url("${url}") center / cover no-repeat, #0b0e14`;
  }
}

function selectIcon(el: HTMLElement | null) {
  iconsEl.querySelectorAll('.desk-icon.selected').forEach((n) => n.classList.remove('selected'));
  el?.classList.add('selected');
}

function renderIcons() {
  iconsEl.innerHTML = '';
  let entries: ReturnType<typeof vfs.list> = [];
  try { entries = vfs.list(desktopDir()); } catch { return; }

  for (const { name, node } of entries) {
    const full = Path.join(desktopDir(), name);
    const isApp = name.endsWith('.app');
    const icon = h('div', { class: 'desk-icon', tabindex: '0' },
      h('span', { class: 'di-img', html: entryIcon(name, node as never) }),
      h('span', { class: 'di-label' }, entryLabel(name, node as never)),
    );
    icon.addEventListener('click', (e) => { e.stopPropagation(); selectIcon(icon); });
    icon.addEventListener('dblclick', () => openPath(full));
    icon.addEventListener('keydown', (e) => { if (e.key === 'Enter') openPath(full); });
    icon.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      e.stopPropagation();
      selectIcon(icon);
      showMenu(e.clientX, e.clientY, [
        { label: 'Open', icon: icons.open, onClick: () => openPath(full) },
        ...(isApp ? [] : [{
          label: 'Open with Editor', icon: icons.editor,
          onClick: () => void kernel.launch('editor', { path: full }),
        }]),
        { separator: true },
        {
          label: 'Rename', icon: icons.rename, onClick: async () => {
            const newName = await promptDialog({ title: 'Rename', value: name });
            if (newName && newName !== name) {
              try { vfs.move(full, Path.join(desktopDir(), newName)); } catch (err) { void confirmDialog({ title: 'Error', body: String(err), okText: 'OK' }); }
            }
          },
        },
        {
          label: 'Delete', icon: icons.trash, danger: true, onClick: async () => {
            if (await confirmDialog({ title: `Delete "${name}"?`, body: 'This cannot be undone.', okText: 'Delete', danger: true })) {
              try { vfs.remove(full, true); } catch { /* gone */ }
            }
          },
        },
      ]);
    });
    iconsEl.append(icon);
  }
}

export function initDesktop(root: HTMLElement): HTMLElement {
  wallEl = h('div', { class: 'wallpaper' });
  iconsEl = h('div', { class: 'desk-icons' });
  const windowLayer = h('div', { class: 'window-layer' });
  const desktop = h('div', { class: 'desktop' }, wallEl, iconsEl, windowLayer);
  root.append(desktop);

  applyWallpaper();
  renderIcons();

  settings.on('change:wallpaper', () => applyWallpaper());
  vfs.on('change', debounce((p) => {
    if (String(p).startsWith(desktopDir()) || String(p) === homeDir()) renderIcons();
  }, 120));

  desktop.addEventListener('click', (e) => {
    if (e.target === wallEl || e.target === iconsEl || e.target === desktop) selectIcon(null);
  });
  iconsEl.addEventListener('contextmenu', (e) => {
    if (e.target !== iconsEl) return;
    desktopMenu(e);
  });
  wallEl.addEventListener('contextmenu', desktopMenu);

  function desktopMenu(e: MouseEvent) {
    e.preventDefault();
    showMenu(e.clientX, e.clientY, [
      {
        label: 'New file', icon: icons.newFile, onClick: async () => {
          const name = await promptDialog({ title: 'New file', placeholder: 'notes.txt' });
          if (name) { try { vfs.writeFile(Path.join(desktopDir(), name), ''); } catch { /* exists */ } }
        },
      },
      {
        label: 'New folder', icon: icons.newFolder, onClick: async () => {
          const name = await promptDialog({ title: 'New folder', placeholder: 'Folder name' });
          if (name) { try { vfs.mkdir(Path.join(desktopDir(), name)); } catch { /* exists */ } }
        },
      },
      { separator: true },
      { label: 'Open Terminal here', icon: icons.terminal, onClick: () => void kernel.launch('terminal', { cwd: desktopDir() }) },
      { label: 'Change wallpaper', icon: icons.pictures, onClick: () => void kernel.launch('settings', { section: 'appearance' }) },
      { separator: true },
      { label: 'Refresh', icon: icons.reload, onClick: renderIcons },
    ]);
  }

  return windowLayer;
}
