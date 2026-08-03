/** Global right-click context menu. */
import { h } from '../core/utils';

export interface MenuItem {
  label?: string;
  icon?: string;
  danger?: boolean;
  disabled?: boolean;
  separator?: boolean;
  onClick?: () => void;
}

let current: HTMLElement | null = null;

export function closeMenu() {
  current?.remove();
  current = null;
}

export function showMenu(x: number, y: number, items: MenuItem[]) {
  closeMenu();
  const menu = h('div', { class: 'ctx-menu' });
  for (const item of items) {
    if (item.separator) {
      menu.append(h('div', { class: 'ctx-sep' }));
      continue;
    }
    const el = h('button', {
      class: `ctx-item${item.danger ? ' danger' : ''}`,
      disabled: item.disabled,
      onclick: () => {
        closeMenu();
        item.onClick?.();
      },
    },
      h('span', { class: 'ctx-icon', html: item.icon ?? '' }),
      h('span', null, item.label ?? ''),
    );
    menu.append(el);
  }
  document.body.append(menu);
  const r = menu.getBoundingClientRect();
  menu.style.left = `${Math.min(x, window.innerWidth - r.width - 6)}px`;
  menu.style.top = `${Math.min(y, window.innerHeight - r.height - 6)}px`;
  current = menu;
}

document.addEventListener('pointerdown', (e) => {
  if (current && !current.contains(e.target as Node)) closeMenu();
}, { capture: true });
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeMenu();
});
window.addEventListener('blur', closeMenu);
