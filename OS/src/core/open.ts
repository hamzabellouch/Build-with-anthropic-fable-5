/** Shared "open this path with the right app" logic. */
import { Path } from './utils';
import { vfs } from './vfs';
import { kernel } from './kernel';
import { iconForFile } from '../icons';

const IMAGE_EXTS = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'ico', 'svg'];
const TEXT_EXTS = ['txt', 'md', 'log', 'json', 'js', 'ts', 'css', 'csv', 'conf', 'sh', 'py', 'xml'];

export function openPath(path: string): void {
  const p = Path.normalize(path);
  const node = vfs.stat(p);
  if (!node) return;

  if (node.type === 'dir') {
    void kernel.launch('files', { path: p });
    return;
  }
  const ext = Path.ext(p);
  if (ext === 'app') {
    void kernel.launch(node.content.trim());
    return;
  }
  if (IMAGE_EXTS.includes(ext) || node.content.startsWith('data:image/')) {
    void kernel.launch('viewer', { path: p });
    return;
  }
  if (ext === 'html') {
    void kernel.launch('browser', { vfsPath: p });
    return;
  }
  if (TEXT_EXTS.includes(ext) || !ext || node.content.length < 500_000) {
    void kernel.launch('editor', { path: p });
    return;
  }
  void kernel.launch('editor', { path: p });
}

/** Icon for a VFS entry; resolves .app files to their app icon. */
export function entryIcon(name: string, node: { type: string; content?: string }): string {
  if (node.type === 'file' && name.endsWith('.app')) {
    const app = kernel.app((node.content ?? '').trim());
    if (app) return app.icon;
  }
  return iconForFile(name, node.type === 'dir');
}

/** Display label for a VFS entry (.app files show their app name). */
export function entryLabel(name: string, node: { type: string; content?: string }): string {
  if (node.type === 'file' && name.endsWith('.app')) {
    const app = kernel.app((node.content ?? '').trim());
    if (app) return app.name;
  }
  return name;
}
