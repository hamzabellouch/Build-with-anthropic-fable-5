/**
 * The FableOS kernel: app registry, process table, lifecycle and system
 * power actions. Apps are launched into windows created by the WM.
 */
import { EventBus } from './utils';
import { wm, OSWindow } from '../ui/wm';
import { vfs } from './vfs';
import { settings } from './settings';

export interface AppContext {
  pid: number;
  args: Record<string, unknown>;
  win: OSWindow;
  root: HTMLElement;
  /** Register cleanup to run when the window closes (timers, rAF loops…). */
  onClose(cb: () => void): void;
}

export interface AppManifest {
  id: string;
  name: string;
  icon: string;
  description: string;
  multiInstance?: boolean;
  window?: {
    width?: number; height?: number;
    minWidth?: number; minHeight?: number;
    resizable?: boolean;
  };
  launch(ctx: AppContext): void | Promise<void>;
}

export interface Process {
  pid: number;
  app: AppManifest;
  win: OSWindow;
  started: number;
}

export const OS_VERSION = '1.0';
export const OS_CODENAME = 'Aurora';
export const KERNEL_VERSION = '5.0.0-fable';
export const BOOT_TIME = Date.now();

class Kernel extends EventBus {
  private registry = new Map<string, AppManifest>();
  private procs = new Map<number, Process>();
  private nextPid = 1;

  register(app: AppManifest) {
    this.registry.set(app.id, app);
  }

  app(id: string): AppManifest | undefined {
    return this.registry.get(id);
  }

  listApps(): AppManifest[] {
    return [...this.registry.values()];
  }

  processes(): Process[] {
    return [...this.procs.values()];
  }

  async launch(appId: string, args: Record<string, unknown> = {}): Promise<Process | null> {
    const app = this.registry.get(appId);
    if (!app) {
      console.warn(`[kernel] unknown app: ${appId}`);
      return null;
    }
    if (!app.multiInstance) {
      const existing = this.processes().find((p) => p.app.id === appId);
      if (existing) {
        existing.win.focus();
        this.emit('app:args', existing, args);
        return existing;
      }
    }

    const pid = this.nextPid++;
    const cleanups: Array<() => void> = [];
    const win = wm.create({
      title: app.name,
      icon: app.icon,
      ...app.window,
    });
    const proc: Process = { pid, app, win, started: Date.now() };
    this.procs.set(pid, proc);

    const unsub = wm.events.on('close', (w) => {
      if (w === win && this.procs.has(pid)) {
        unsub();
        this.procs.delete(pid);
        cleanups.forEach((cb) => { try { cb(); } catch (e) { console.error(e); } });
        this.emit('process:exit', proc);
      }
    });

    const ctx: AppContext = {
      pid,
      args,
      win,
      root: win.content,
      onClose: (cb) => cleanups.push(cb),
    };
    try {
      await app.launch(ctx);
    } catch (e) {
      console.error(`[kernel] ${appId} crashed during launch`, e);
      win.content.innerHTML = `<div style="padding:20px;color:#f87171;font-family:monospace">
        App crashed during launch:<br>${String(e)}</div>`;
    }
    this.emit('process:spawn', proc);
    return proc;
  }

  kill(pid: number): boolean {
    const proc = this.procs.get(pid);
    if (!proc) return false;
    void proc.win.close(true);
    return true;
  }

  uptime(): number {
    return Date.now() - BOOT_TIME;
  }

  reboot() {
    void vfs.persist().finally(() => location.reload());
  }

  shutdown() {
    void vfs.persist();
    this.emit('shutdown');
  }

  async resetOS() {
    settings.reset();
    await vfs.resetAll();
    try { localStorage.removeItem('fableos.history'); localStorage.removeItem('fableos.snake-hi'); } catch { /* ignore */ }
    location.reload();
  }
}

export const kernel = new Kernel();
