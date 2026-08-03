import { useSyncExternalStore } from "react";
import { normalizeVaultData, SAVE_TAB_ID, STORAGE_KEY, store, Store } from "../store";
import { HttpVaultBackend } from "./http";
import type { RemoteVaultBackend } from "./backend";

/**
 * Background sync between the local-first store (localStorage — instant,
 * authoritative for the running app) and a RemoteVaultBackend (the bundled
 * server, backed by SQLite or Postgres).
 *
 * The policy mirrors the existing cross-tab one:
 *  - Every save lands in localStorage first; the app never blocks on the
 *    network and keeps working with no server at all.
 *  - Pushes are CAS on the server revision. A stale push means someone wrote
 *    first: if that writer was a sibling tab, the shared meta below absorbs
 *    it quietly; a foreign writer (another browser/device) triggers the
 *    conflict path — the local version is backed up to localStorage, the
 *    server version is adopted, and a sticky notice offers "Restore mine"
 *    (which re-imports the backup and re-pushes it).
 *  - A server whose rev moved *backwards* (wiped or swapped database) is
 *    treated as stale and republished over — local data wins (local-first).
 */

export const SYNC_KEY = "obsidian-web.sync.v1";
const PUSH_DEBOUNCE_MS = 700;
const POLL_MS = 15_000;
const VAULT_ID = "default";

export type SyncStatusKind = "off" | "unreachable" | "syncing" | "synced" | "error";

export interface SyncSnapshot {
  enabled: boolean;
  url: string;
  status: SyncStatusKind;
  /** human-readable detail for tooltips (last error, …) */
  detail: string;
  lastSyncAt: number | null;
  remoteRev: number;
}

/** Device-local sync state. Deliberately NOT part of the synced blob — every
    browser keeps its own server URL and sync point. Shared across this
    browser's tabs through localStorage, so siblings never fight over revs. */
interface SyncMeta {
  enabled: boolean;
  url: string;
  /** server rev our local state already incorporates */
  remoteRev: number;
  /** local rev at the moment of the last successful sync */
  localRev: number;
}

const DEFAULT_META: SyncMeta = { enabled: true, url: "/api", remoteRev: 0, localRev: 0 };

function readMeta(): SyncMeta {
  try {
    const raw = localStorage.getItem(SYNC_KEY);
    if (!raw) return { ...DEFAULT_META };
    const data = JSON.parse(raw);
    return {
      enabled: typeof data?.enabled === "boolean" ? data.enabled : DEFAULT_META.enabled,
      url: typeof data?.url === "string" && data.url.trim() ? data.url : DEFAULT_META.url,
      remoteRev: typeof data?.remoteRev === "number" && data.remoteRev >= 0 ? Math.floor(data.remoteRev) : 0,
      localRev: typeof data?.localRev === "number" && data.localRev >= 0 ? Math.floor(data.localRev) : 0,
    };
  } catch {
    return { ...DEFAULT_META };
  }
}

function writeMeta(meta: SyncMeta) {
  try {
    localStorage.setItem(SYNC_KEY, JSON.stringify(meta));
  } catch {
    /* quota — the sync point is reconstructible, never block on it */
  }
}

/** keep only the newest couple of conflict backups around */
function pruneConflictBackups() {
  const prefix = `${STORAGE_KEY}.conflict-`;
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith(prefix)) keys.push(k);
  }
  keys.sort();
  while (keys.length > 2) localStorage.removeItem(keys.shift()!);
}

export class SyncEngine {
  private store: Store;
  private backend: RemoteVaultBackend;
  private snap: SyncSnapshot;
  private listeners = new Set<() => void>();
  private pushTimer: number | undefined;
  private running = false;
  private rerun = false;
  private started = false;

  constructor(s: Store) {
    this.store = s;
    const meta = readMeta();
    this.backend = new HttpVaultBackend(meta.url, VAULT_ID);
    this.snap = {
      enabled: meta.enabled,
      url: meta.url,
      status: meta.enabled ? "syncing" : "off",
      detail: "",
      lastSyncAt: null,
      remoteRev: meta.remoteRev,
    };
  }

  /* ---------------- public surface ---------------- */

  start() {
    if (this.started) return;
    this.started = true;
    this.store.onDidSave = () => this.schedulePush();
    window.addEventListener("focus", this.kick);
    window.addEventListener("online", this.kick);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") this.kick();
    });
    // sibling tabs share config + sync point through SYNC_KEY
    window.addEventListener("storage", (e) => {
      if (e.key !== SYNC_KEY) return;
      const meta = readMeta();
      if (meta.url !== this.snap.url) this.backend = new HttpVaultBackend(meta.url, VAULT_ID);
      this.update({
        enabled: meta.enabled,
        url: meta.url,
        remoteRev: meta.remoteRev,
        status: meta.enabled ? (this.snap.status === "off" ? "synced" : this.snap.status) : "off",
      });
    });
    window.setInterval(() => {
      if (document.visibilityState === "visible") this.kick();
    }, POLL_MS);
    // let boot settle before the first round-trip
    window.setTimeout(this.kick, 400);
  }

  kick = () => void this.run();

  subscribe = (fn: () => void) => {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  };
  getSnapshot = (): SyncSnapshot => this.snap;

  setConfig(partial: { enabled?: boolean; url?: string }) {
    const meta = readMeta();
    const url = partial.url !== undefined ? partial.url.trim() || DEFAULT_META.url : meta.url;
    const enabled = partial.enabled ?? meta.enabled;
    const next: SyncMeta = { enabled, url, remoteRev: meta.remoteRev, localRev: meta.localRev };
    if (url !== meta.url) {
      // a different server is a different lineage — forget the old sync point;
      // the next cycle either publishes (empty server) or pulls/conflicts (busy one)
      next.remoteRev = 0;
      next.localRev = 0;
      this.backend = new HttpVaultBackend(url, VAULT_ID);
    }
    writeMeta(next);
    this.update({ enabled, url, remoteRev: next.remoteRev, status: enabled ? "syncing" : "off", detail: "" });
    if (enabled) this.schedulePush(50);
  }

  /* ---------------- engine ---------------- */

  private update(partial: Partial<SyncSnapshot>) {
    this.snap = { ...this.snap, ...partial };
    this.listeners.forEach((fn) => fn());
  }

  private schedulePush(delay = PUSH_DEBOUNCE_MS + Math.random() * 300) {
    if (!this.snap.enabled) return;
    clearTimeout(this.pushTimer);
    this.pushTimer = window.setTimeout(this.kick, delay);
  }

  private async run() {
    if (this.running) {
      this.rerun = true;
      return;
    }
    this.running = true;
    try {
      let guard = 0;
      do {
        this.rerun = false;
        await this.cycle();
      } while (this.rerun && ++guard < 4);
    } finally {
      this.running = false;
    }
  }

  private async cycle() {
    const meta = readMeta();
    if (!meta.enabled) {
      this.update({ enabled: false, url: meta.url, status: "off" });
      return;
    }
    this.store.flushSave(); // bring localStorage (and localRev) up to date with memory
    const dirty = this.store.localRev > meta.localRev;
    this.update({ enabled: true, url: meta.url, status: "syncing" });
    try {
      if (dirty) await this.pushLocal(meta);
      else await this.pullRemote(meta);
    } catch (err) {
      this.update({ status: "unreachable", detail: err instanceof Error ? err.message : "Sync server unreachable" });
    }
  }

  private markSynced(meta: SyncMeta) {
    writeMeta(meta);
    this.update({ status: "synced", detail: "", lastSyncAt: Date.now(), remoteRev: meta.remoteRev });
  }

  private async pushLocal(meta: SyncMeta) {
    const res = await this.backend.push(meta.remoteRev, SAVE_TAB_ID, this.store.persistedPayload());
    if (res.status === "ok") {
      this.markSynced({ ...meta, remoteRev: res.rev, localRev: this.store.localRev });
      return;
    }
    // conflict — someone reached rev `res.rev` before us
    const shared = readMeta(); // a sibling tab may already have absorbed that write
    if (res.rev <= shared.remoteRev) {
      this.rerun = true; // recompute dirtiness against the fresher shared meta
      return;
    }
    this.adoptConflict(res.rev, res.data, shared);
  }

  private async pullRemote(meta: SyncMeta) {
    const res = await this.backend.fetch(meta.remoteRev > 0 ? meta.remoteRev : null);
    if (res.status === "unchanged") {
      this.markSynced(meta);
      return;
    }
    if (res.status === "empty") {
      // nothing stored remotely yet — publish what we have to seed the server
      const pushed = await this.backend.push(0, SAVE_TAB_ID, this.store.persistedPayload());
      if (pushed.status === "ok") this.markSynced({ ...meta, remoteRev: pushed.rev, localRev: this.store.localRev });
      else this.rerun = true; // raced another publisher; reconcile next cycle
      return;
    }
    if (res.rev === meta.remoteRev) {
      this.markSynced(meta);
    } else if (res.rev > meta.remoteRev) {
      // another writer moved the server forward and we have no local changes → adopt
      this.adoptRemote(res.rev, res.data, meta);
    } else {
      // the server rev moved BACKWARDS (wiped or swapped database) — our data
      // descends from a newer lineage, so local-first means republishing over it
      const pushed = await this.backend.push(res.rev, SAVE_TAB_ID, this.store.persistedPayload());
      if (pushed.status === "ok") this.markSynced({ ...meta, remoteRev: pushed.rev, localRev: this.store.localRev });
      else this.rerun = true;
    }
  }

  private adoptRemote(rev: number, data: unknown, meta: SyncMeta): boolean {
    // the server blob is untrusted input, exactly like a localStorage blob
    const normalized = normalizeVaultData(data);
    if (!normalized) {
      this.update({ status: "error", detail: "Sync server returned an unreadable vault" });
      return false;
    }
    this.store.adoptFromSync(normalized);
    this.markSynced({ ...meta, remoteRev: rev, localRev: this.store.localRev });
    return true;
  }

  private adoptConflict(rev: number, data: unknown, meta: SyncMeta) {
    // keep the user's version safe before the server's wins
    const backupKey = `${STORAGE_KEY}.conflict-${Date.now()}`;
    let backedUp = true;
    try {
      pruneConflictBackups();
      localStorage.setItem(backupKey, JSON.stringify(this.store.persistedPayload()));
    } catch {
      backedUp = false;
    }
    if (!this.adoptRemote(rev, data, meta)) return;
    this.store.notice(
      "Sync conflict: the server had newer changes from another device, so they were loaded.",
      backedUp
        ? {
            sticky: true,
            action: {
              label: "Restore mine",
              run: () => {
                try {
                  const raw = localStorage.getItem(backupKey);
                  const restored = raw ? normalizeVaultData(JSON.parse(raw)) : null;
                  // importData persists → marks the vault dirty → the next push wins
                  if (restored) this.store.importData(restored.vault, restored.ui);
                } catch {
                  /* backup unreadable — nothing to restore */
                }
              },
            },
          }
        : { sticky: true }
    );
  }
}

export const syncEngine = new SyncEngine(store);

export function useSync(): SyncSnapshot {
  return useSyncExternalStore(syncEngine.subscribe, syncEngine.getSnapshot);
}
