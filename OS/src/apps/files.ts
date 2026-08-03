/**
 * Files — the FableOS file manager. Navigation with history, grid/list
 * views, clipboard (cut/copy/paste shared across windows), drag & drop
 * moves, host upload/download, rename, delete, properties.
 */
import { h, Path, formatBytes, debounce } from '../core/utils';
import { vfs, homeDir, FSNode } from '../core/vfs';
import { kernel, AppManifest, AppContext } from '../core/kernel';
import { openPath, entryIcon, entryLabel } from '../core/open';
import { icons } from '../icons';
import { showMenu } from '../ui/contextmenu';
import { promptDialog, confirmDialog, alertDialog } from '../ui/dialogs';
import { notify } from '../ui/notifications';

/** Shared clipboard so cut/copy in one window pastes in another. */
let clipboard: { mode: 'copy' | 'cut'; path: string } | null = null;

const PLACES = () => [
  { name: 'Home', path: homeDir(), icon: icons.home },
  { name: 'Desktop', path: `${homeDir()}/Desktop`, icon: icons.desktopIcon },
  { name: 'Documents', path: `${homeDir()}/Documents`, icon: icons.documents },
  { name: 'Pictures', path: `${homeDir()}/Pictures`, icon: icons.pictures },
  { name: 'Music', path: `${homeDir()}/Music`, icon: icons.music },
  { name: 'Downloads', path: `${homeDir()}/Downloads`, icon: icons.downloads },
  { name: 'System /', path: '/', icon: icons.drive },
];

function isTextual(node: FSNode): boolean {
  return node.type === 'file' && !node.content.startsWith('data:');
}

function downloadEntry(name: string, node: FSNode) {
  if (node.type !== 'file') return;
  const a = document.createElement('a');
  if (node.content.startsWith('data:')) {
    a.href = node.content;
  } else {
    const ext = Path.ext(name);
    const mime = ext === 'svg' ? 'image/svg+xml' : ext === 'html' ? 'text/html' : 'text/plain';
    a.href = URL.createObjectURL(new Blob([node.content], { type: mime }));
  }
  a.download = name;
  a.click();
  setTimeout(() => { if (a.href.startsWith('blob:')) URL.revokeObjectURL(a.href); }, 4000);
}

function launchFiles(ctx: AppContext) {
  let cwd = typeof ctx.args.path === 'string' && vfs.isDir(ctx.args.path)
    ? Path.normalize(ctx.args.path) : homeDir();
  let view: 'grid' | 'list' = 'grid';
  let selected: string | null = null;
  const back: string[] = [];
  const fwd: string[] = [];

  const crumbs = h('div', { class: 'fm-crumbs' });
  const entriesEl = h('div', { class: 'fm-entries grid', tabindex: '0' });
  const statusEl = h('div', { class: 'fm-status' });
  const sidebarEl = h('div', { class: 'fm-sidebar' });

  const tbtn = (title: string, icon: string, onclick: () => void) => {
    const b = h('button', { class: 'tool-btn', title, html: icon });
    b.addEventListener('click', onclick);
    return b;
  };

  const backBtn = tbtn('Back', icons.back, () => {
    const p = back.pop();
    if (p) { fwd.push(cwd); navigate(p, false); }
  });
  const fwdBtn = tbtn('Forward', icons.forward, () => {
    const p = fwd.pop();
    if (p) { back.push(cwd); navigate(p, false); }
  });
  const upBtn = tbtn('Up', icons.up, () => { if (cwd !== '/') navigate(Path.dirname(cwd)); });

  const uploadInput = h('input', { type: 'file', multiple: true, style: { display: 'none' } });
  uploadInput.addEventListener('change', async () => {
    const files = [...(uploadInput.files ?? [])];
    for (const f of files) {
      const target = uniqueName(cwd, f.name);
      const textLike = f.type.startsWith('text/') || /\.(txt|md|json|js|ts|css|html|csv|svg|sh|py|xml|log|conf)$/i.test(f.name);
      const content = await (textLike ? f.text() : readAsDataURL(f));
      try { vfs.writeFile(target, content); } catch (e) { void alertDialog({ title: 'Upload failed', body: String(e) }); }
    }
    if (files.length) notify({ title: 'Files imported', body: `${files.length} file(s) added to ${cwd}`, icon: icons.download });
    uploadInput.value = '';
  });

  const viewBtn = tbtn('Toggle view', icons.list, () => {
    view = view === 'grid' ? 'list' : 'grid';
    viewBtn.innerHTML = view === 'grid' ? icons.list : icons.grid;
    entriesEl.classList.toggle('grid', view === 'grid');
    entriesEl.classList.toggle('list', view === 'list');
    render();
  });

  const toolbar = h('div', { class: 'fm-toolbar' },
    backBtn, fwdBtn, upBtn,
    crumbs,
    tbtn('New folder', icons.newFolder, () => void newFolder()),
    tbtn('New file', icons.newFile, () => void newFile()),
    tbtn('Import from your computer', icons.upload, () => uploadInput.click()),
    viewBtn,
  );

  ctx.root.append(
    h('div', { class: 'fm' },
      toolbar,
      h('div', { class: 'fm-main' }, sidebarEl, entriesEl),
      statusEl,
      uploadInput,
    ),
  );

  function readAsDataURL(f: File): Promise<string> {
    return new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(String(r.result));
      r.onerror = () => rej(r.error);
      r.readAsDataURL(f);
    });
  }

  function uniqueName(dir: string, name: string): string {
    let candidate = Path.join(dir, name);
    let i = 1;
    while (vfs.exists(candidate)) {
      const dot = name.lastIndexOf('.');
      const stem = dot > 0 ? name.slice(0, dot) : name;
      const ext = dot > 0 ? name.slice(dot) : '';
      candidate = Path.join(dir, `${stem} (${i++})${ext}`);
    }
    return candidate;
  }

  async function newFolder() {
    const name = await promptDialog({ title: 'New folder', placeholder: 'Folder name' });
    if (!name) return;
    try { vfs.mkdir(Path.join(cwd, name)); } catch (e) { void alertDialog({ title: 'Error', body: String(e) }); }
  }

  async function newFile() {
    const name = await promptDialog({ title: 'New file', placeholder: 'notes.txt' });
    if (!name) return;
    try { vfs.writeFile(Path.join(cwd, name), ''); } catch (e) { void alertDialog({ title: 'Error', body: String(e) }); }
  }

  async function renameEntry(name: string) {
    const newName = await promptDialog({ title: 'Rename', value: name });
    if (!newName || newName === name) return;
    try { vfs.move(Path.join(cwd, name), Path.join(cwd, newName)); }
    catch (e) { void alertDialog({ title: 'Error', body: String(e) }); }
  }

  async function deleteEntry(name: string) {
    const ok = await confirmDialog({
      title: `Delete "${name}"?`, body: 'This cannot be undone.', okText: 'Delete', danger: true,
    });
    if (!ok) return;
    try { vfs.remove(Path.join(cwd, name), true); selected = null; }
    catch (e) { void alertDialog({ title: 'Error', body: String(e) }); }
  }

  function pasteInto(dir: string) {
    if (!clipboard) return;
    const src = clipboard.path;
    if (!vfs.exists(src)) { clipboard = null; return; }
    const dst = uniqueName(dir, Path.basename(src));
    try {
      if (clipboard.mode === 'copy') vfs.copy(src, dst);
      else { vfs.move(src, dst); clipboard = null; }
    } catch (e) { void alertDialog({ title: 'Paste failed', body: String(e) }); }
  }

  function showProperties(name: string, node: FSNode) {
    const size = vfs.sizeOf(node);
    const body = h('div', { class: 'props' },
      h('div', null, h('b', null, 'Name: '), name),
      h('div', null, h('b', null, 'Path: '), Path.join(cwd, name)),
      h('div', null, h('b', null, 'Type: '), node.type === 'dir' ? 'Folder' : `File (.${Path.ext(name) || '—'})`),
      h('div', null, h('b', null, 'Size: '), `${formatBytes(size)}${node.type === 'dir' ? ` in ${vfs.countFiles(node)} files` : ''}`),
      h('div', null, h('b', null, 'Created: '), new Date(node.ctime).toLocaleString()),
      h('div', null, h('b', null, 'Modified: '), new Date(node.mtime).toLocaleString()),
    );
    void alertDialog({ title: 'Properties', body });
  }

  function entryMenu(e: MouseEvent, name: string, node: FSNode) {
    e.preventDefault();
    e.stopPropagation();
    select(name);
    const full = Path.join(cwd, name);
    showMenu(e.clientX, e.clientY, [
      { label: 'Open', icon: icons.open, onClick: () => openEntry(name, node) },
      ...(node.type === 'file' && isTextual(node) && !name.endsWith('.app')
        ? [{ label: 'Open with Editor', icon: icons.editor, onClick: () => void kernel.launch('editor', { path: full }) }]
        : []),
      { separator: true },
      { label: 'Cut', icon: icons.close, onClick: () => { clipboard = { mode: 'cut', path: full }; } },
      { label: 'Copy', icon: icons.fileText, onClick: () => { clipboard = { mode: 'copy', path: full }; } },
      { separator: true },
      { label: 'Rename', icon: icons.rename, onClick: () => void renameEntry(name) },
      { label: 'Delete', icon: icons.trash, danger: true, onClick: () => void deleteEntry(name) },
      { separator: true },
      ...(node.type === 'file' ? [{ label: 'Download to your computer', icon: icons.download, onClick: () => downloadEntry(name, node) }] : []),
      { label: 'Properties', icon: icons.info, onClick: () => showProperties(name, node) },
    ]);
  }

  function bgMenu(e: MouseEvent) {
    e.preventDefault();
    showMenu(e.clientX, e.clientY, [
      { label: 'New folder', icon: icons.newFolder, onClick: () => void newFolder() },
      { label: 'New file', icon: icons.newFile, onClick: () => void newFile() },
      { separator: true },
      { label: 'Paste', icon: icons.fileText, disabled: !clipboard, onClick: () => pasteInto(cwd) },
      { separator: true },
      { label: 'Open Terminal here', icon: icons.terminal, onClick: () => void kernel.launch('terminal', { cwd }) },
      { label: 'Refresh', icon: icons.reload, onClick: render },
    ]);
  }

  function select(name: string | null) {
    selected = name;
    entriesEl.querySelectorAll('.fm-entry').forEach((el) => {
      el.classList.toggle('selected', (el as HTMLElement).dataset.name === name);
    });
    updateStatus();
  }

  function openEntry(name: string, node: FSNode) {
    const full = Path.join(cwd, name);
    if (node.type === 'dir') navigate(full);
    else openPath(full);
  }

  function updateStatus() {
    let entries: Array<{ name: string; node: FSNode }> = [];
    try { entries = vfs.list(cwd); } catch { /* gone */ }
    let text = `${entries.length} item${entries.length === 1 ? '' : 's'}`;
    if (selected) {
      const node = vfs.stat(Path.join(cwd, selected));
      if (node) text += `  ·  "${selected}" ${node.type === 'file' ? formatBytes(node.content.length) : 'folder'}`;
    }
    if (clipboard) text += `  ·  clipboard: ${Path.basename(clipboard.path)} (${clipboard.mode})`;
    statusEl.textContent = text;
  }

  function renderSidebar() {
    sidebarEl.innerHTML = '';
    for (const place of PLACES()) {
      const btn = h('button', { class: `fm-place${cwd === place.path ? ' active' : ''}` },
        h('span', { class: 'fm-place-icon', html: place.icon }),
        h('span', null, place.name),
      );
      btn.addEventListener('click', () => navigate(place.path));
      btn.addEventListener('dragover', (e) => e.preventDefault());
      btn.addEventListener('drop', (e) => {
        e.preventDefault();
        const src = e.dataTransfer?.getData('application/x-fableos-path');
        if (src && vfs.exists(src)) {
          try { vfs.move(src, uniqueName(place.path, Path.basename(src))); } catch { /* into self */ }
        }
      });
      sidebarEl.append(btn);
    }
  }

  function renderCrumbs() {
    crumbs.innerHTML = '';
    const parts = cwd === '/' ? [] : cwd.slice(1).split('/');
    const rootBtn = h('button', { class: 'crumb' }, '/');
    rootBtn.addEventListener('click', () => navigate('/'));
    crumbs.append(rootBtn);
    let acc = '';
    for (const part of parts) {
      acc += '/' + part;
      const target = acc;
      crumbs.append(h('span', { class: 'crumb-sep' }, '›'));
      const b = h('button', { class: 'crumb' }, part);
      b.addEventListener('click', () => navigate(target));
      crumbs.append(b);
    }
  }

  function render() {
    if (!vfs.exists(cwd)) cwd = homeDir();
    renderCrumbs();
    renderSidebar();
    backBtn.toggleAttribute('disabled', !back.length);
    fwdBtn.toggleAttribute('disabled', !fwd.length);
    upBtn.toggleAttribute('disabled', cwd === '/');
    ctx.win.setTitle(`Files — ${cwd === homeDir() ? '~' : Path.basename(cwd) || '/'}`);

    entriesEl.innerHTML = '';
    let entries: Array<{ name: string; node: FSNode }> = [];
    try { entries = vfs.list(cwd); } catch { /* gone */ }

    for (const { name, node } of entries) {
      const full = Path.join(cwd, name);
      const el = h('div', {
        class: 'fm-entry', dataset: { name }, draggable: 'true', tabindex: '0',
      },
        h('span', { class: 'fm-entry-icon', html: entryIcon(name, node as never) }),
        h('span', { class: 'fm-entry-name' }, entryLabel(name, node as never)),
        view === 'list'
          ? h('span', { class: 'fm-entry-meta' },
            node.type === 'file' ? formatBytes(node.content.length) : `${Object.keys(node.children).length} items`)
          : null,
      );
      el.addEventListener('click', (e) => { e.stopPropagation(); select(name); });
      el.addEventListener('dblclick', () => openEntry(name, node));
      el.addEventListener('keydown', (e) => { if (e.key === 'Enter') openEntry(name, node); });
      el.addEventListener('contextmenu', (e) => entryMenu(e, name, node));
      el.addEventListener('dragstart', (e) => {
        e.dataTransfer?.setData('application/x-fableos-path', full);
        e.dataTransfer!.effectAllowed = 'move';
      });
      if (node.type === 'dir') {
        el.addEventListener('dragover', (e) => { e.preventDefault(); el.classList.add('drop'); });
        el.addEventListener('dragleave', () => el.classList.remove('drop'));
        el.addEventListener('drop', (e) => {
          e.preventDefault();
          el.classList.remove('drop');
          const src = e.dataTransfer?.getData('application/x-fableos-path');
          if (src && src !== full && vfs.exists(src)) {
            try { vfs.move(src, uniqueName(full, Path.basename(src))); } catch { /* invalid */ }
          }
        });
      }
      entriesEl.append(el);
    }
    if (!entries.length) {
      entriesEl.append(h('div', { class: 'fm-empty' }, 'This folder is empty'));
    }
    if (selected && !entries.some((e) => e.name === selected)) selected = null;
    select(selected);
    updateStatus();
  }

  function navigate(path: string, pushHistory = true) {
    if (pushHistory && path !== cwd) { back.push(cwd); fwd.length = 0; }
    cwd = Path.normalize(path);
    selected = null;
    render();
  }

  entriesEl.addEventListener('click', () => select(null));
  entriesEl.addEventListener('contextmenu', (e) => {
    if ((e.target as HTMLElement).closest('.fm-entry')) return;
    bgMenu(e);
  });
  entriesEl.addEventListener('keydown', (e) => {
    if (e.key === 'Delete' && selected) void deleteEntry(selected);
    else if (e.key === 'F2' && selected) void renameEntry(selected);
    else if (e.key === 'Backspace' && cwd !== '/') navigate(Path.dirname(cwd));
  });

  const unsub = vfs.on('change', debounce(() => { if (!ctx.win.closed) render(); }, 100));
  ctx.onClose(unsub);

  render();
}

export const filesApp: AppManifest = {
  id: 'files',
  name: 'Files',
  icon: icons.files,
  description: 'Browse and manage the virtual file system',
  multiInstance: true,
  window: { width: 880, height: 560, minWidth: 520, minHeight: 320 },
  launch: launchFiles,
};
