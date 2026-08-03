/** System modal dialogs: alert / confirm / prompt and a VFS file picker. */
import { h, Path } from '../core/utils';
import { vfs, homeDir } from '../core/vfs';
import { icons, iconForFile } from '../icons';

function modal(card: HTMLElement, onCancel: () => void): HTMLElement {
  const overlay = h('div', { class: 'dlg-overlay' }, card);
  overlay.addEventListener('pointerdown', (e) => {
    if (e.target === overlay) onCancel();
  });
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') { e.stopPropagation(); onCancel(); }
  };
  overlay.addEventListener('keydown', onKey);
  document.body.append(overlay);
  return overlay;
}

interface AlertOpts { title?: string; body?: string | HTMLElement; okText?: string }

export function alertDialog(opts: AlertOpts | string): Promise<void> {
  const o = typeof opts === 'string' ? { body: opts } : opts;
  return new Promise((resolve) => {
    const done = () => { overlay.remove(); resolve(); };
    const ok = h('button', { class: 'btn primary', onclick: done }, o.okText ?? 'OK');
    const overlay = modal(
      h('div', { class: 'dlg' },
        h('div', { class: 'dlg-title' }, o.title ?? 'FableOS'),
        h('div', { class: 'dlg-body' }, o.body ?? ''),
        h('div', { class: 'dlg-actions' }, ok),
      ), done);
    ok.focus();
  });
}

interface ConfirmOpts { title?: string; body?: string; okText?: string; cancelText?: string; danger?: boolean }

export function confirmDialog(opts: ConfirmOpts | string): Promise<boolean> {
  const o = typeof opts === 'string' ? { body: opts } : opts;
  return new Promise((resolve) => {
    const finish = (v: boolean) => { overlay.remove(); resolve(v); };
    const ok = h('button', {
      class: `btn ${o.danger ? 'danger' : 'primary'}`,
      onclick: () => finish(true),
    }, o.okText ?? 'OK');
    const overlay = modal(
      h('div', { class: 'dlg' },
        h('div', { class: 'dlg-title' }, o.title ?? 'Are you sure?'),
        h('div', { class: 'dlg-body' }, o.body ?? ''),
        h('div', { class: 'dlg-actions' },
          h('button', { class: 'btn', onclick: () => finish(false) }, o.cancelText ?? 'Cancel'),
          ok,
        ),
      ), () => finish(false));
    ok.focus();
  });
}

interface PromptOpts { title?: string; body?: string; value?: string; placeholder?: string; okText?: string }

export function promptDialog(opts: PromptOpts | string): Promise<string | null> {
  const o = typeof opts === 'string' ? { title: opts } : opts;
  return new Promise((resolve) => {
    const finish = (v: string | null) => { overlay.remove(); resolve(v); };
    const input = h('input', {
      class: 'input', type: 'text',
      value: o.value ?? '', placeholder: o.placeholder ?? '',
      onkeydown: (e: KeyboardEvent) => {
        if (e.key === 'Enter') finish(input.value);
      },
    });
    const overlay = modal(
      h('div', { class: 'dlg' },
        h('div', { class: 'dlg-title' }, o.title ?? 'Input'),
        o.body ? h('div', { class: 'dlg-body' }, o.body) : null,
        h('div', { class: 'dlg-body' }, input),
        h('div', { class: 'dlg-actions' },
          h('button', { class: 'btn', onclick: () => finish(null) }, 'Cancel'),
          h('button', { class: 'btn primary', onclick: () => finish(input.value) }, o.okText ?? 'OK'),
        ),
      ), () => finish(null));
    input.focus();
    input.select();
  });
}

interface PickOpts {
  mode: 'open' | 'save';
  title?: string;
  startDir?: string;
  defaultName?: string;
  /** Only show files with these extensions (dirs always shown). */
  exts?: string[];
}

/** A miniature file explorer used as the system open/save dialog. */
export function pickFile(opts: PickOpts): Promise<string | null> {
  return new Promise((resolve) => {
    let cwd = opts.startDir && vfs.isDir(opts.startDir) ? Path.normalize(opts.startDir) : homeDir();
    const finish = (v: string | null) => { overlay.remove(); resolve(v); };

    const pathLabel = h('div', { class: 'picker-path' });
    const listEl = h('div', { class: 'picker-list' });
    const nameInput = h('input', {
      class: 'input', type: 'text',
      value: opts.defaultName ?? '',
      placeholder: 'File name',
      onkeydown: (e: KeyboardEvent) => { if (e.key === 'Enter') submit(); },
    });

    function submit() {
      const name = nameInput.value.trim();
      if (!name) return;
      finish(Path.join(cwd, name));
    }

    function render() {
      pathLabel.textContent = cwd;
      listEl.innerHTML = '';
      if (cwd !== '/') {
        listEl.append(h('button', { class: 'picker-item', onclick: () => { cwd = Path.dirname(cwd); render(); } },
          h('span', { class: 'pi-icon', html: icons.up }), h('span', null, '..')));
      }
      let entries: Array<{ name: string; node: { type: string } }> = [];
      try { entries = vfs.list(cwd); } catch { /* gone */ }
      for (const { name, node } of entries) {
        const isDir = node.type === 'dir';
        if (!isDir && opts.exts && !opts.exts.includes(Path.ext(name))) continue;
        listEl.append(h('button', {
          class: 'picker-item',
          onclick: () => {
            if (isDir) { cwd = Path.join(cwd, name); render(); }
            else {
              nameInput.value = name;
              if (opts.mode === 'open') finish(Path.join(cwd, name));
            }
          },
        },
          h('span', { class: 'pi-icon', html: iconForFile(name, isDir) }),
          h('span', null, name),
        ));
      }
      if (!listEl.children.length) listEl.append(h('div', { class: 'picker-empty' }, 'Empty folder'));
    }

    const overlay = modal(
      h('div', { class: 'dlg dlg-picker' },
        h('div', { class: 'dlg-title' }, opts.title ?? (opts.mode === 'open' ? 'Open file' : 'Save file')),
        pathLabel,
        listEl,
        opts.mode === 'save' ? h('div', { class: 'picker-name' }, nameInput) : null,
        h('div', { class: 'dlg-actions' },
          h('button', { class: 'btn', onclick: () => finish(null) }, 'Cancel'),
          opts.mode === 'save'
            ? h('button', { class: 'btn primary', onclick: submit }, 'Save')
            : null,
        ),
      ), () => finish(null));
    render();
    if (opts.mode === 'save') nameInput.focus();
  });
}
