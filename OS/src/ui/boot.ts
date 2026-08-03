/** Boot, lock, shutdown and panic screens. */
import { h, sleep, formatClock, formatDate } from '../core/utils';
import { settings } from '../core/settings';
import { KERNEL_VERSION, OS_VERSION, OS_CODENAME } from '../core/kernel';
import { logo } from '../icons';

const BOOT_LINES = [
  ['FableOS Firmware v5.0 — initializing', 30],
  ['Memory check: ' + Math.round((navigator as { deviceMemory?: number }).deviceMemory ?? 8) + ' GiB OK', 60],
  [`Loading kernel ${KERNEL_VERSION} ...`, 120],
  ['[  OK  ] Reached target Basic System', 50],
  ['[  OK  ] Mounted /dev/idb0 on / (fablefs)', 90],
  ['[  OK  ] Started Virtual File System', 40],
  ['[  OK  ] Started FableWM display server', 70],
  ['[  OK  ] Started Audio Synthesis Service', 30],
  ['[  OK  ] Started Notification Daemon', 30],
  ['[  OK  ] Reached target Graphical Interface', 60],
  [`Welcome to FableOS ${OS_VERSION} (${OS_CODENAME})`, 40],
] as Array<[string, number]>;

/** Plays the boot sequence; resolves when finished or skipped. */
export async function showBoot(ready: Promise<unknown>): Promise<void> {
  const log = h('div', { class: 'boot-log' });
  const bar = h('div', { class: 'boot-bar-fill' });
  const screen = h('div', { class: 'boot-screen' },
    h('div', { class: 'boot-logo', html: logo }),
    h('div', { class: 'boot-name' }, 'FableOS'),
    h('div', { class: 'boot-bar' }, bar),
    log,
    h('div', { class: 'boot-hint' }, 'press any key to skip'),
  );
  document.body.append(screen);

  let skipped = false;
  const skip = () => { skipped = true; };
  window.addEventListener('keydown', skip, { once: true });
  screen.addEventListener('pointerdown', skip, { once: true });

  for (let i = 0; i < BOOT_LINES.length; i++) {
    if (skipped) break;
    const [text, delay] = BOOT_LINES[i];
    const line = h('div', { class: 'boot-line' }, text);
    if (text.startsWith('[  OK  ]')) {
      line.innerHTML = `<span class="boot-ok">[  OK  ]</span>${text.slice(8)}`;
    }
    log.append(line);
    bar.style.width = `${Math.round(((i + 1) / BOOT_LINES.length) * 100)}%`;
    await sleep(delay + Math.random() * 90);
  }
  bar.style.width = '100%';
  await ready;
  if (!skipped) await sleep(250);

  window.removeEventListener('keydown', skip);
  screen.classList.add('fade-out');
  await sleep(450);
  screen.remove();
}

export function lockScreen() {
  const time = h('div', { class: 'lock-time' });
  const date = h('div', { class: 'lock-date' });
  const tick = () => {
    const d = new Date();
    time.textContent = formatClock(d);
    date.textContent = formatDate(d);
  };
  tick();
  const interval = setInterval(tick, 1000);

  const screen = h('div', { class: 'lock-screen' },
    h('div', { class: 'lock-clock' }, time, date),
    h('div', { class: 'lock-user' },
      h('span', { class: 'lock-avatar' }, settings.get('username').charAt(0).toUpperCase()),
      h('div', { class: 'lock-name' }, settings.get('username')),
      h('div', { class: 'lock-hint' }, 'Click anywhere or press any key to unlock'),
    ),
  );

  const unlock = () => {
    clearInterval(interval);
    window.removeEventListener('keydown', unlock);
    screen.classList.add('fade-out');
    setTimeout(() => screen.remove(), 400);
  };
  screen.addEventListener('pointerdown', unlock);
  window.addEventListener('keydown', unlock);
  document.body.append(screen);
}

export function showShutdown() {
  const screen = h('div', { class: 'shutdown-screen' },
    h('div', { class: 'boot-logo dim', html: logo }),
    h('div', { class: 'shutdown-msg' }, 'FableOS has shut down.'),
    h('div', { class: 'shutdown-sub' }, 'It is now safe to close this tab.'),
    h('button', {
      class: 'btn primary', style: { marginTop: '24px' },
      onclick: () => location.reload(),
    }, 'Power on again'),
  );
  document.body.append(screen);
  requestAnimationFrame(() => screen.classList.add('on'));
}

export function panic(reason: string) {
  const screen = h('div', { class: 'panic-screen' },
    h('div', { class: 'panic-face' }, ':('),
    h('div', { class: 'panic-msg' },
      'FableOS ran into a problem it pretended not to be able to recover from.'),
    h('div', { class: 'panic-code' }, `KERNEL PANIC — ${reason}`),
    h('div', { class: 'panic-hint' }, 'Press any key or click to reboot'),
  );
  const reboot = () => location.reload();
  screen.addEventListener('pointerdown', reboot);
  window.addEventListener('keydown', reboot, { once: true });
  document.body.append(screen);
}
