/** FableOS entry point — boots the system. */
import './styles/base.css';
import './styles/system.css';
import './styles/apps.css';

import { settings } from './core/settings';
import { vfs } from './core/vfs';
import { kernel } from './core/kernel';
import { sfx } from './core/sound';
import { wm } from './ui/wm';
import { initDesktop } from './ui/desktop';
import { initTaskbar } from './ui/taskbar';
import { showBoot, showShutdown } from './ui/boot';
import { notify } from './ui/notifications';
import { registerApps } from './apps/index';
import { icons, logo } from './icons';

async function boot() {
  settings.applyTheme();

  const ready = vfs.init();
  const bootDone = showBoot(ready);

  await ready;
  registerApps();

  const root = document.getElementById('os-root')!;
  const windowLayer = initDesktop(root);
  wm.init(windowLayer);
  initTaskbar(root);

  kernel.on('shutdown', () => showShutdown());

  // Global shortcuts + niceties
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.altKey && (e.key === 't' || e.key === 'T')) {
      e.preventDefault();
      void kernel.launch('terminal');
    }
  });
  document.addEventListener('contextmenu', (e) => {
    const t = e.target as HTMLElement;
    if (!t.closest('input, textarea, [contenteditable], iframe')) e.preventDefault();
  });

  await bootDone;
  sfx.chime();

  if (!settings.get('firstBootDone')) {
    settings.set('firstBootDone', true);
    void kernel.launch('welcome');
    setTimeout(() => notify({
      title: 'Welcome to FableOS',
      body: 'Everything here runs and persists in your browser. Have a look around.',
      icon: logo,
      timeout: 6000,
    }), 900);
  }

  window.addEventListener('error', (e) => {
    notify({ title: 'System error', body: String(e.message).slice(0, 140), icon: icons.info, silent: true });
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) void vfs.persist();
  });
}

void boot();
