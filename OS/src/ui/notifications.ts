/** Toast notification center. */
import { h } from '../core/utils';
import { icons } from '../icons';
import { sfx } from '../core/sound';

let container: HTMLElement | null = null;

function ensureContainer(): HTMLElement {
  if (!container) {
    container = h('div', { class: 'toasts' });
    document.body.append(container);
  }
  return container;
}

export interface NotifyOpts {
  title: string;
  body?: string;
  icon?: string;
  timeout?: number;
  silent?: boolean;
}

export function notify(opts: NotifyOpts) {
  const root = ensureContainer();
  const toast = h('div', { class: 'toast' },
    h('span', { class: 'toast-icon', html: opts.icon ?? icons.info }),
    h('div', { class: 'toast-text' },
      h('div', { class: 'toast-title' }, opts.title),
      opts.body ? h('div', { class: 'toast-body' }, opts.body) : null,
    ),
    h('button', { class: 'toast-close', html: icons.close, onclick: dismiss }),
  );

  let dismissed = false;
  function dismiss() {
    if (dismissed) return;
    dismissed = true;
    toast.classList.add('out');
    setTimeout(() => toast.remove(), 220);
  }

  root.append(toast);
  while (root.children.length > 5) root.firstElementChild?.remove();
  if (!opts.silent) sfx.notify();
  setTimeout(dismiss, opts.timeout ?? 4500);
  return dismiss;
}
