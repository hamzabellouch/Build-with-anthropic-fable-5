/**
 * Scribe — the FableOS text editor. Line numbers, Ctrl+S save, save-as via
 * the system file picker, dirty tracking with close confirmation, and a
 * live Markdown preview for .md files.
 */
import { h, Path, escapeHtml } from '../core/utils';
import { vfs, homeDir } from '../core/vfs';
import { AppManifest, AppContext } from '../core/kernel';
import { icons } from '../icons';
import { pickFile, confirmDialog, alertDialog } from '../ui/dialogs';
import { notify } from '../ui/notifications';

/** Tiny Markdown renderer (escapes HTML first; safe for local content). */
function renderMarkdown(src: string): string {
  const esc = escapeHtml(src);
  const blocks = esc.split(/```/);
  let html = '';
  for (let i = 0; i < blocks.length; i++) {
    if (i % 2 === 1) {
      const body = blocks[i].replace(/^[a-z]*\n/, '');
      html += `<pre class="md-code">${body}</pre>`;
      continue;
    }
    let b = blocks[i];
    b = b.replace(/^###### (.*)$/gm, '<h6>$1</h6>')
      .replace(/^##### (.*)$/gm, '<h5>$1</h5>')
      .replace(/^#### (.*)$/gm, '<h4>$1</h4>')
      .replace(/^### (.*)$/gm, '<h3>$1</h3>')
      .replace(/^## (.*)$/gm, '<h2>$1</h2>')
      .replace(/^# (.*)$/gm, '<h1>$1</h1>')
      .replace(/^(---|\*\*\*)$/gm, '<hr>')
      .replace(/^&gt; (.*)$/gm, '<blockquote>$1</blockquote>')
      .replace(/^[-*] \[x\] (.*)$/gm, '<div class="md-task done">☑ $1</div>')
      .replace(/^[-*] \[ \] (.*)$/gm, '<div class="md-task">☐ $1</div>')
      .replace(/^[-*] (.*)$/gm, '<li>$1</li>')
      .replace(/^(\d+)\. (.*)$/gm, '<li class="md-ol">$2</li>')
      .replace(/(<li[^>]*>.*<\/li>\n?)+/g, (m) => `<ul>${m}</ul>`)
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
      .replace(/\n\n+/g, '</p><p>');
    html += `<p>${b}</p>`;
  }
  return html;
}

function launchEditor(ctx: AppContext) {
  let filePath: string | null = typeof ctx.args.path === 'string' ? ctx.args.path : null;
  let dirty = false;
  let preview = false;

  const textarea = h('textarea', {
    class: 'ed-text', spellcheck: 'false',
    placeholder: 'Start typing…',
  });
  const gutter = h('div', { class: 'ed-gutter' }, '1');
  const previewEl = h('div', { class: 'ed-preview' });
  const statusLeft = h('span');
  const statusRight = h('span');

  const isMd = () => !!filePath && Path.ext(filePath) === 'md';

  const updateTitle = () => {
    const name = filePath ? Path.basename(filePath) : 'Untitled';
    ctx.win.setTitle(`${dirty ? '● ' : ''}${name} — Scribe`);
  };

  const updateGutter = () => {
    const lines = textarea.value.split('\n').length;
    gutter.innerHTML = '';
    for (let i = 1; i <= lines; i++) gutter.append(h('div', null, String(i)));
    gutter.scrollTop = textarea.scrollTop;
  };

  const updateStatus = () => {
    const value = textarea.value;
    const pos = textarea.selectionStart ?? 0;
    const before = value.slice(0, pos);
    const line = before.split('\n').length;
    const col = pos - before.lastIndexOf('\n');
    statusLeft.textContent = filePath ?? 'Untitled (not saved)';
    statusRight.textContent = `Ln ${line}, Col ${col}  ·  ${value.length} chars`;
  };

  const markDirty = (d: boolean) => {
    dirty = d;
    updateTitle();
  };

  const refreshPreview = () => {
    if (preview) previewEl.innerHTML = renderMarkdown(textarea.value);
  };

  async function save(as = false): Promise<boolean> {
    let target = filePath;
    if (as || !target) {
      target = await pickFile({
        mode: 'save',
        title: 'Save file',
        startDir: filePath ? Path.dirname(filePath) : `${homeDir()}/Documents`,
        defaultName: filePath ? Path.basename(filePath) : 'untitled.txt',
      });
      if (!target) return false;
    }
    try {
      if (vfs.isDir(target)) throw new Error('target is a directory');
      vfs.writeFile(target, textarea.value);
      filePath = target;
      markDirty(false);
      previewBtn.style.display = isMd() ? '' : 'none';
      notify({ title: 'Saved', body: target, icon: icons.save, timeout: 1800, silent: true });
      return true;
    } catch (e) {
      void alertDialog({ title: 'Save failed', body: String(e) });
      return false;
    }
  }

  async function openFile() {
    if (dirty && !(await confirmDialog({ title: 'Discard changes?', body: 'Unsaved changes will be lost.', okText: 'Discard' }))) return;
    const p = await pickFile({ mode: 'open', title: 'Open file', startDir: filePath ? Path.dirname(filePath) : homeDir() });
    if (!p) return;
    try {
      const content = vfs.readFile(p);
      if (content.startsWith('data:')) {
        void alertDialog({ title: 'Binary file', body: 'This file contains binary data — try the Image Viewer instead.' });
        return;
      }
      filePath = p;
      textarea.value = content;
      markDirty(false);
      afterLoad();
    } catch (e) {
      void alertDialog({ title: 'Open failed', body: String(e) });
    }
  }

  const tbtn = (title: string, icon: string, onclick: () => void) => {
    const b = h('button', { class: 'tool-btn', title, html: icon });
    b.addEventListener('click', onclick);
    return b;
  };

  const previewBtn = tbtn('Toggle Markdown preview', icons.eye, () => {
    preview = !preview;
    previewEl.style.display = preview ? '' : 'none';
    refreshPreview();
  });

  let fontSize = 14;
  const applyFont = () => {
    textarea.style.fontSize = `${fontSize}px`;
    gutter.style.fontSize = `${fontSize}px`;
    updateGutter();
  };

  const toolbar = h('div', { class: 'ed-toolbar' },
    tbtn('Open (file picker)', icons.open, () => void openFile()),
    tbtn('Save (Ctrl+S)', icons.save, () => void save()),
    tbtn('Save as…', icons.download, () => void save(true)),
    h('span', { class: 'tool-sep' }),
    previewBtn,
    tbtn('Smaller text', icons.zoomOut, () => { fontSize = Math.max(10, fontSize - 1); applyFont(); }),
    tbtn('Larger text', icons.zoomIn, () => { fontSize = Math.min(28, fontSize + 1); applyFont(); }),
  );

  const editArea = h('div', { class: 'ed-area' }, gutter, textarea, previewEl);
  previewEl.style.display = 'none';

  ctx.root.append(
    h('div', { class: 'editor' },
      toolbar,
      editArea,
      h('div', { class: 'ed-status' }, statusLeft, statusRight),
    ),
  );

  textarea.addEventListener('input', () => {
    markDirty(true);
    updateGutter();
    updateStatus();
    refreshPreview();
  });
  textarea.addEventListener('scroll', () => { gutter.scrollTop = textarea.scrollTop; });
  ['keyup', 'click'].forEach((ev) => textarea.addEventListener(ev, updateStatus));
  textarea.addEventListener('keydown', (e) => {
    if (e.key === 's' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      void save(e.shiftKey);
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const s = textarea.selectionStart, end = textarea.selectionEnd;
      textarea.value = textarea.value.slice(0, s) + '  ' + textarea.value.slice(end);
      textarea.setSelectionRange(s + 2, s + 2);
      markDirty(true);
      updateGutter();
    }
  });

  function afterLoad() {
    updateTitle();
    updateGutter();
    updateStatus();
    previewBtn.style.display = isMd() ? '' : 'none';
    preview = false;
    previewEl.style.display = 'none';
  }

  ctx.win.onBeforeClose = async () => {
    if (!dirty) return true;
    return confirmDialog({
      title: 'Discard unsaved changes?',
      body: filePath ?? 'Untitled', okText: 'Discard', danger: true,
    });
  };

  if (filePath) {
    try {
      const content = vfs.readFile(filePath);
      if (content.startsWith('data:')) {
        textarea.value = `(binary file, ${content.length} bytes as data URL)\n\n${content.slice(0, 2000)}…`;
      } else {
        textarea.value = content;
      }
    } catch {
      filePath = null;
    }
  }
  afterLoad();
  setTimeout(() => textarea.focus(), 60);
}

export const editorApp: AppManifest = {
  id: 'editor',
  name: 'Scribe',
  icon: icons.editor,
  description: 'Text editor with Markdown preview',
  multiInstance: true,
  window: { width: 780, height: 540, minWidth: 420, minHeight: 280 },
  launch: launchEditor,
};
