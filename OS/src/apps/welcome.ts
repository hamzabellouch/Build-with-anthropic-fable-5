/** Welcome — first-boot tour of FableOS. */
import { h } from '../core/utils';
import { kernel, AppManifest, AppContext, OS_VERSION, OS_CODENAME } from '../core/kernel';
import { icons, logo } from '../icons';

function launchWelcome(ctx: AppContext) {
  const card = (icon: string, title: string, body: string, appId: string, label: string) => {
    const btn = h('button', { class: 'btn small' }, label);
    btn.addEventListener('click', () => void kernel.launch(appId));
    return h('div', { class: 'wel-card' },
      h('span', { class: 'wel-card-icon', html: icon }),
      h('div', { class: 'wel-card-text' },
        h('b', null, title),
        h('span', null, body),
      ),
      btn,
    );
  };

  ctx.root.append(
    h('div', { class: 'welcome' },
      h('div', { class: 'wel-hero' },
        h('span', { class: 'wel-logo', html: logo }),
        h('div', null,
          h('h1', null, `Welcome to FableOS ${OS_VERSION}`),
          h('p', null, `"${OS_CODENAME}" — a complete operating system living in this browser tab. `
            + 'Kernel, file system, window manager, twelve apps: all built from scratch, zero dependencies.'),
        ),
      ),
      h('div', { class: 'wel-cards' },
        card(icons.terminal, 'Terminal', 'A real shell with pipes, redirection and tab completion. Try `neofetch` or `cowsay hi | cat`.', 'terminal', 'Open'),
        card(icons.files, 'Files', 'Your files persist in IndexedDB — they survive reboots. Drag entries onto folders to move them.', 'files', 'Browse'),
        card(icons.paint, 'Paint', 'Draw something, save it to Pictures, then right-click it in Viewer to make it your wallpaper.', 'paint', 'Draw'),
        card(icons.settings, 'Settings', 'Dark/light theme, accent colors, wallpapers, your username — make it yours.', 'settings', 'Tweak'),
        card(icons.minesweeper, 'Games', 'Minesweeper and Snake are in the start menu. Productivity is optional.', 'minesweeper', 'Play'),
        card(icons.piano, 'Keys', 'A synth piano. Press the letter keys, or let it play Ode to Joy.', 'piano', 'Jam'),
      ),
      h('div', { class: 'wel-tips' },
        h('b', null, 'Tips'),
        h('ul', null,
          h('li', null, 'Drag a window to the top edge to maximize, to the sides to snap half-screen.'),
          h('li', null, 'Ctrl+Alt+T opens a terminal anywhere.'),
          h('li', null, 'Right-click the desktop, files, taskbar buttons — context menus are everywhere.'),
          h('li', null, 'Everything is throwaway-safe: Settings → System → Reset restores the factory image.'),
        ),
      ),
    ),
  );
}

export const welcomeApp: AppManifest = {
  id: 'welcome',
  name: 'Welcome',
  icon: icons.welcome,
  description: 'Tour of FableOS',
  window: { width: 700, height: 600, minWidth: 480, minHeight: 400 },
  launch: launchWelcome,
};
