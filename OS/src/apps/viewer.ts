/** Image viewer for VFS images (data URLs and raw SVG files). */
import { h, Path } from '../core/utils';
import { vfs } from '../core/vfs';
import { AppManifest, AppContext } from '../core/kernel';
import { settings } from '../core/settings';
import { icons } from '../icons';
import { pickFile } from '../ui/dialogs';
import { notify } from '../ui/notifications';

function srcFor(path: string, content: string): string {
  if (content.startsWith('data:')) return content;
  if (Path.ext(path) === 'svg') {
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(content);
  }
  return content;
}

function launchViewer(ctx: AppContext) {
  let path = typeof ctx.args.path === 'string' ? ctx.args.path : null;
  let zoom = 1;
  let fitMode = true;

  const img = h('img', { class: 'viewer-img', alt: 'image' });
  const stage = h('div', { class: 'viewer-stage' }, img);
  const zoomLabel = h('span', { class: 'viewer-zoom' }, 'fit');

  const apply = () => {
    if (fitMode) {
      img.style.maxWidth = '100%';
      img.style.maxHeight = '100%';
      img.style.transform = '';
      zoomLabel.textContent = 'fit';
    } else {
      img.style.maxWidth = 'none';
      img.style.maxHeight = 'none';
      img.style.transform = `scale(${zoom})`;
      zoomLabel.textContent = `${Math.round(zoom * 100)}%`;
    }
  };

  const load = (p: string) => {
    try {
      const content = vfs.readFile(p);
      img.src = srcFor(p, content);
      path = p;
      ctx.win.setTitle(`${Path.basename(p)} — Viewer`);
      fitMode = true;
      zoom = 1;
      apply();
    } catch {
      stage.innerHTML = '';
      stage.append(h('div', { class: 'viewer-err' }, `Could not open ${p}`));
    }
  };

  const tbtn = (title: string, icon: string, onclick: () => void) => {
    const b = h('button', { class: 'tool-btn', title, html: icon });
    b.addEventListener('click', onclick);
    return b;
  };

  ctx.root.append(
    h('div', { class: 'viewer' },
      h('div', { class: 'viewer-toolbar' },
        tbtn('Open…', icons.open, async () => {
          const p = await pickFile({
            mode: 'open', title: 'Open image',
            exts: ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'bmp', 'ico'],
            startDir: path ? Path.dirname(path) : undefined,
          });
          if (p) load(p);
        }),
        h('span', { class: 'tool-sep' }),
        tbtn('Zoom out', icons.zoomOut, () => { fitMode = false; zoom = Math.max(0.1, zoom / 1.25); apply(); }),
        zoomLabel,
        tbtn('Zoom in', icons.zoomIn, () => { fitMode = false; zoom = Math.min(8, zoom * 1.25); apply(); }),
        tbtn('Fit to window', icons.fit, () => { fitMode = true; apply(); }),
        h('span', { class: 'tool-sep' }),
        tbtn('Set as wallpaper', icons.pictures, () => {
          if (!path) return;
          const content = vfs.readFile(path);
          settings.set('wallpaper', { type: 'image', value: content });
          notify({ title: 'Wallpaper changed', body: Path.basename(path), icon: icons.pictures });
        }),
      ),
      stage,
    ),
  );

  if (path) load(path);
  else {
    img.remove();
    stage.append(h('div', { class: 'viewer-err' }, 'No image — use Open to pick one'));
  }
}

export const viewerApp: AppManifest = {
  id: 'viewer',
  name: 'Viewer',
  icon: icons.viewer,
  description: 'Image viewer',
  multiInstance: true,
  window: { width: 700, height: 520, minWidth: 360, minHeight: 260 },
  launch: launchViewer,
};
