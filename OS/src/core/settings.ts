/** Persistent reactive settings store (localStorage-backed). */
import { EventBus } from './utils';

export type Wallpaper =
  | { type: 'preset'; id: string }
  | { type: 'color'; value: string }
  | { type: 'image'; value: string };

export interface OSSettings {
  theme: 'dark' | 'light';
  accent: string;
  wallpaper: Wallpaper;
  username: string;
  hostname: string;
  sounds: boolean;
  firstBootDone: boolean;
}

const DEFAULTS: OSSettings = {
  theme: 'dark',
  accent: '#6d8dff',
  wallpaper: { type: 'preset', id: 'aurora' },
  username: 'hani',
  hostname: 'fableos',
  sounds: true,
  firstBootDone: false,
};

const LS_KEY = 'fableos.settings';

class SettingsStore extends EventBus {
  private data: OSSettings;

  constructor() {
    super();
    let saved: Partial<OSSettings> = {};
    try { saved = JSON.parse(localStorage.getItem(LS_KEY) ?? '{}'); } catch { /* fresh */ }
    this.data = { ...DEFAULTS, ...saved };
  }

  get<K extends keyof OSSettings>(key: K): OSSettings[K] {
    return this.data[key];
  }

  set<K extends keyof OSSettings>(key: K, value: OSSettings[K]) {
    this.data[key] = value;
    try { localStorage.setItem(LS_KEY, JSON.stringify(this.data)); } catch { /* quota */ }
    this.emit('change', key, value);
    this.emit(`change:${key}`, value);
  }

  applyTheme() {
    document.documentElement.dataset.theme = this.data.theme;
    document.documentElement.style.setProperty('--accent', this.data.accent);
  }

  reset() {
    try { localStorage.removeItem(LS_KEY); } catch { /* ignore */ }
  }
}

export const settings = new SettingsStore();
settings.on('change:theme', () => settings.applyTheme());
settings.on('change:accent', () => settings.applyTheme());
