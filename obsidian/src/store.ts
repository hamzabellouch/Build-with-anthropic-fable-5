import { useSyncExternalStore } from "react";
import type {
  AppState, LeftTab, ModalState, Notice, PendingNav, RightTab, Settings, SortMode, Tab, TrashEntry, UIState, Vault, VaultNode, ViewMode,
} from "./types";
import { buildSeedUI, buildSeedVault, DEFAULT_SETTINGS } from "./seed";

export const STORAGE_KEY = "obsidian-web.vault.v1";
export const SCHEMA_VERSION = 2;
/** Random per-tab id stamped into every save so tabs can tell each other's writes apart. */
export const SAVE_TAB_ID = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

let nextId = 1;
const genId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${(nextId++).toString(36)}`;
let noticeId = 1;

/* ---------- Arabic-aware normalization (for search) ---------- */
const DIACRITICS = /[ً-ْٰـ]/;
export function normalizeWithMap(s: string): { norm: string; map: number[] } {
  let norm = "";
  const map: number[] = [];
  for (let i = 0; i < s.length; i++) {
    let ch = s[i];
    if (DIACRITICS.test(ch)) continue;
    if (ch === "أ" || ch === "إ" || ch === "آ" || ch === "ٱ") ch = "ا";
    norm += ch.toLowerCase();
    map.push(i);
  }
  return { norm, map };
}
export const normalize = (s: string) => normalizeWithMap(s).norm;

export interface SearchMatch {
  fileId: string;
  from: number;
  to: number;
  lineText: string;
  lineStart: number;
}

/* ---------- persisted-blob validation / migration ---------- */
// Save format v2: { schemaVersion: 2, rev, savedBy, vault, ui }.
// Legacy v1 blobs ({ vault, ui }) are accepted and migrated silently (rev starts at 0).

function isObj(x: unknown): x is Record<string, any> {
  return !!x && typeof x === "object";
}

function sanitizeNode(id: string, raw: unknown): VaultNode | null {
  if (!isObj(raw)) return null;
  if (raw.type !== "file" && raw.type !== "folder") return null;
  const node: VaultNode = {
    id,
    type: raw.type,
    name: typeof raw.name === "string" && raw.name.trim() ? raw.name : "Untitled",
    parent: typeof raw.parent === "string" ? raw.parent : null,
  };
  if (raw.type === "folder") {
    node.children = Array.isArray(raw.children)
      ? raw.children.filter((c: unknown): c is string => typeof c === "string")
      : [];
  } else {
    node.content = typeof raw.content === "string" ? raw.content : "";
  }
  if (typeof raw.icon === "string") node.icon = raw.icon;
  if (typeof raw.color === "string") node.color = raw.color;
  return node;
}

function normalizeSettings(raw: unknown): Settings {
  const s: Settings = { ...DEFAULT_SETTINGS };
  if (isObj(raw)) {
    if (typeof raw.fontSize === "number" && Number.isFinite(raw.fontSize)) s.fontSize = Math.max(9, Math.min(48, raw.fontSize));
    if (typeof raw.lineWidth === "number" && Number.isFinite(raw.lineWidth)) s.lineWidth = Math.max(320, Math.min(4000, raw.lineWidth));
    if (typeof raw.accent === "string" && raw.accent.trim()) s.accent = raw.accent;
    if (typeof raw.spellcheck === "boolean") s.spellcheck = raw.spellcheck;
  }
  return s;
}

/**
 * Deep-validate a persisted blob (v1 or v2) into a consistent { vault, ui }.
 * Defensive everywhere: bad nodes are dropped, orphans fall back to the root,
 * parent cycles are broken, and every UI field gets a sane default — a malformed
 * blob must degrade gracefully, never white-screen. Returns null only when the
 * vault itself is unrecoverable (no nodes record at all).
 */
export function normalizeVaultData(data: unknown): { vault: Vault; ui: UIState } | null {
  if (!isObj(data) || !isObj(data.vault) || !isObj(data.vault.nodes)) return null;
  const rawVault = data.vault;

  /* nodes */
  const nodes: Record<string, VaultNode> = {};
  for (const [id, rawNode] of Object.entries(rawVault.nodes)) {
    if (!id) continue;
    const node = sanitizeNode(id, rawNode);
    if (node) nodes[id] = node;
  }

  /* parent links: drop pointers to self / missing / non-folder parents */
  for (const n of Object.values(nodes)) {
    if (n.parent !== null && (n.parent === n.id || nodes[n.parent]?.type !== "folder")) n.parent = null;
  }
  /* break parent cycles (they would hang pathOf) */
  for (const n of Object.values(nodes)) {
    const seen = new Set<string>([n.id]);
    let prev = n;
    let cur = n.parent ? nodes[n.parent] : undefined;
    while (cur) {
      if (seen.has(cur.id)) {
        prev.parent = null;
        break;
      }
      seen.add(cur.id);
      prev = cur;
      cur = cur.parent ? nodes[cur.parent] : undefined;
    }
  }

  /* children/root rebuilt from parent pointers (which win over stale lists),
     keeping the declared order; unclaimed nodes are appended, orphans go to root */
  const placed = new Set<string>();
  const claim = (parentId: string | null, declared: string[]): string[] => {
    const out: string[] = [];
    for (const cid of declared) {
      const child = nodes[cid];
      if (child && child.parent === parentId && !placed.has(cid)) {
        placed.add(cid);
        out.push(cid);
      }
    }
    return out;
  };
  for (const n of Object.values(nodes)) {
    if (n.type === "folder") n.children = claim(n.id, n.children ?? []);
  }
  const root = claim(
    null,
    Array.isArray(rawVault.root) ? rawVault.root.filter((c: unknown): c is string => typeof c === "string") : []
  );
  for (const n of Object.values(nodes)) {
    if (placed.has(n.id)) continue;
    placed.add(n.id);
    const parent = n.parent ? nodes[n.parent] : undefined;
    if (parent?.type === "folder") parent.children!.push(n.id);
    else {
      n.parent = null;
      root.push(n.id);
    }
  }

  /* trash */
  const trash: TrashEntry[] = [];
  if (Array.isArray(rawVault.trash)) {
    for (const rawEntry of rawVault.trash) {
      if (trash.length >= 50) break;
      if (!isObj(rawEntry) || typeof rawEntry.rootId !== "string" || !Array.isArray(rawEntry.nodes)) continue;
      const tnodes: VaultNode[] = [];
      for (const tn of rawEntry.nodes) {
        if (!isObj(tn) || typeof tn.id !== "string" || !tn.id) continue;
        const node = sanitizeNode(tn.id, tn);
        if (node) tnodes.push(node);
      }
      if (!tnodes.some((tn) => tn.id === rawEntry.rootId)) continue;
      // restoreTrash inserts these nodes verbatim into the live vault, so a
      // dangling child id here would crash tree sorting after a restore —
      // keep only references that exist inside the entry's own snapshot
      const inEntry = new Set(tnodes.map((tn) => tn.id));
      for (const tn of tnodes) {
        if (tn.children) tn.children = tn.children.filter((c) => inEntry.has(c));
      }
      trash.push({
        entryId: typeof rawEntry.entryId === "string" && rawEntry.entryId ? rawEntry.entryId : genId("trash"),
        deletedAt: typeof rawEntry.deletedAt === "number" && Number.isFinite(rawEntry.deletedAt) ? rawEntry.deletedAt : Date.now(),
        originalParent: typeof rawEntry.originalParent === "string" ? rawEntry.originalParent : null,
        originalPath: typeof rawEntry.originalPath === "string" ? rawEntry.originalPath : "",
        rootId: rawEntry.rootId,
        nodes: tnodes,
      });
    }
  }

  /* ui */
  const rawUI = isObj(data.ui) ? data.ui : {};
  const isFileId = (x: unknown): x is string => typeof x === "string" && nodes[x]?.type === "file";

  const tabs: Tab[] = [];
  if (Array.isArray(rawUI.tabs)) {
    for (const t of rawUI.tabs) {
      if (!isObj(t) || typeof t.id !== "string" || !t.id) continue;
      if (tabs.some((x) => x.id === t.id)) continue;
      const history: (string | null)[] = Array.isArray(t.history)
        ? t.history.filter((h: unknown): h is string | null => h === null || isFileId(h))
        : [];
      let hIndex = Number.isInteger(t.hIndex) ? (t.hIndex as number) : history.length - 1;
      hIndex = Math.max(-1, Math.min(hIndex, history.length - 1));
      tabs.push({
        id: t.id,
        fileId: isFileId(t.fileId) ? t.fileId : null,
        mode: t.mode === "reading" ? "reading" : "live",
        history,
        hIndex,
      });
    }
  }
  if (tabs.length === 0) tabs.push({ id: genId("tab"), fileId: null, mode: "live", history: [], hIndex: -1 });
  const activeTab: string = tabs.some((t) => t.id === rawUI.activeTab) ? rawUI.activeTab : tabs[0].id;

  const expanded: Record<string, boolean> = {};
  if (isObj(rawUI.expanded)) {
    for (const [k, v] of Object.entries(rawUI.expanded)) {
      if (v === true && nodes[k]?.type === "folder") expanded[k] = true;
    }
  }

  const fileList = (ids: unknown, cap: number): string[] => {
    const out: string[] = [];
    if (Array.isArray(ids)) {
      for (const x of ids) {
        if (isFileId(x) && !out.includes(x)) out.push(x);
        if (out.length >= cap) break;
      }
    }
    return out;
  };

  const num = (x: unknown, def: number, min: number, max: number) =>
    typeof x === "number" && Number.isFinite(x) ? Math.max(min, Math.min(max, x)) : def;

  const LEFT_TABS: LeftTab[] = ["files", "search", "bookmarks", "recents"];
  const RIGHT_TABS: RightTab[] = ["backlinks", "outline"];
  const SORTS: SortMode[] = ["custom", "az", "za"];

  const ui: UIState = {
    leftOpen: typeof rawUI.leftOpen === "boolean" ? rawUI.leftOpen : true,
    leftWidth: num(rawUI.leftWidth, 380, 200, 560),
    leftTab: LEFT_TABS.includes(rawUI.leftTab) ? rawUI.leftTab : "files",
    rightOpen: typeof rawUI.rightOpen === "boolean" ? rawUI.rightOpen : false,
    rightWidth: num(rawUI.rightWidth, 280, 200, 520),
    rightTab: RIGHT_TABS.includes(rawUI.rightTab) ? rawUI.rightTab : "outline",
    tabs,
    activeTab,
    expanded,
    bookmarks: fileList(rawUI.bookmarks, Infinity),
    recents: fileList(rawUI.recents, 20),
    sort: SORTS.includes(rawUI.sort) ? rawUI.sort : "custom",
    settings: normalizeSettings(rawUI.settings),
  };

  return { vault: { nodes, root, trash }, ui };
}

function load(): { vault: Vault; ui: UIState; rev: number; bootNotice: string | null } {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch {
    raw = null;
  }
  if (raw == null) return { vault: buildSeedVault(), ui: buildSeedUI(), rev: 0, bootNotice: null };
  try {
    const data = JSON.parse(raw);
    const normalized = normalizeVaultData(data);
    if (normalized) {
      const rev = isObj(data) && typeof data.rev === "number" && Number.isFinite(data.rev) ? Math.max(0, Math.floor(data.rev)) : 0;
      return { ...normalized, rev, bootNotice: null };
    }
  } catch {
    /* malformed JSON — fall through to the backup path */
  }
  // Never silently reseed over bytes we could not read: keep them around first.
  const backupKey = `${STORAGE_KEY}.corrupt-${Date.now()}`;
  let backedUp = true;
  try {
    localStorage.setItem(backupKey, raw);
  } catch {
    backedUp = false;
  }
  return {
    vault: buildSeedVault(),
    ui: buildSeedUI(),
    rev: 0,
    bootNotice: backedUp
      ? `Could not read the stored vault, so a fresh one was loaded. The unreadable data was backed up to localStorage key "${backupKey}".`
      : "Could not read the stored vault, so a fresh one was loaded. Backing up the unreadable data also failed (storage is full).",
  };
}

export class Store {
  state: AppState;
  pending: PendingNav | null = null;
  /** fired after every successful localStorage write — the sync layer listens here */
  onDidSave: (() => void) | null = null;
  private listeners = new Set<() => void>();
  private saveTimer: number | undefined;
  /** true whenever the in-memory state is newer than localStorage */
  private savePending = false;
  /* Multi-tab policy: every save is stamped with rev = lastKnownRev + 1 plus this tab's id.
     The `storage` event (which only fires in OTHER tabs) hands us sibling saves: when a
     sibling wrote a HIGHER rev, we adopt its vault+ui wholesale (whole-blob last-writer-wins)
     instead of later clobbering it with our older snapshot. Adopting raises lastKnownRev,
     so our next save always lands above the sibling's — revs never regress. */
  private lastKnownRev: number;
  private quotaNoticeId: number | null = null;
  /** per-file search normalization, reused while the file's content string is unchanged */
  private searchNormCache = new Map<string, { content: string; norm: string; map: number[] }>();
  /** normalized name -> file, rebuilt whenever namesVersion moves */
  private nameIndex: Map<string, VaultNode> | null = null;
  private nameIndexVersion = -1;

  constructor() {
    const { vault, ui, rev, bootNotice } = load();
    this.lastKnownRev = rev;
    this.state = { vault, ui, renaming: null, modal: null, notices: [], namesVersion: 0, vaultVersion: 0 };
    this.applySettings();
    if (bootNotice) this.notice(bootNotice, { sticky: true });
    // Registered once — the store is a module singleton. Flush pending edits whenever the
    // page may be going away, and adopt newer saves coming from sibling tabs.
    window.addEventListener("pagehide", () => this.flushSave());
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") this.flushSave();
    });
    window.addEventListener("storage", (e) => this.onStorageEvent(e));
  }

  subscribe = (fn: () => void) => {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  };
  get = () => this.state;

  private emit(persist = true) {
    this.state = { ...this.state };
    this.listeners.forEach((fn) => fn());
    if (persist) {
      this.savePending = true;
      clearTimeout(this.saveTimer);
      this.saveTimer = window.setTimeout(() => this.flushSave(), 250);
    }
  }

  /** Synchronous write-through. Runs from the debounce timer, on pagehide / tab-hidden,
      and from the error boundary — anything pending must hit localStorage NOW. */
  flushSave() {
    clearTimeout(this.saveTimer);
    this.saveTimer = undefined;
    if (!this.savePending) return;
    const rev = this.lastKnownRev + 1;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ schemaVersion: SCHEMA_VERSION, rev, savedBy: SAVE_TAB_ID, vault: this.state.vault, ui: this.state.ui })
      );
      this.lastKnownRev = rev;
      this.savePending = false;
      if (this.quotaNoticeId != null) {
        const cleared = this.quotaNoticeId;
        this.quotaNoticeId = null;
        this.dismissNotice(cleared);
      }
      this.onDidSave?.();
    } catch {
      // quota exceeded — savePending stays true so every later save retries
      if (this.quotaNoticeId == null) {
        this.quotaNoticeId = this.notice("Saving failed — storage is full. Export your vault now.", { sticky: true });
      }
    }
  }

  /** Adopt a newer save made by another tab (see the multi-tab policy comment above). */
  private onStorageEvent(e: StorageEvent) {
    if (e.key !== STORAGE_KEY || e.newValue == null) return;
    try {
      const data = JSON.parse(e.newValue);
      if (!isObj(data) || data.savedBy === SAVE_TAB_ID) return;
      const rev = typeof data.rev === "number" && Number.isFinite(data.rev) ? data.rev : 0;
      if (rev <= this.lastKnownRev) return;
      const normalized = normalizeVaultData(data);
      if (!normalized) return;
      // Local edits still inside the debounce window lose to the sibling's save —
      // that is the documented whole-blob last-writer-wins trade-off.
      this.lastKnownRev = rev;
      clearTimeout(this.saveTimer);
      this.savePending = false;
      this.adoptState(normalized.vault, normalized.ui);
    } catch {
      /* ignore unreadable cross-tab payloads */
    }
  }

  /** Swap in externally-produced state (a sibling tab's save or a sync pull). */
  private adoptState(vault: Vault, ui: UIState) {
    this.state.vault = vault;
    this.state.ui = ui;
    this.pending = null;
    this.searchNormCache.clear();
    this.nameIndex = null;
    this.state.vaultVersion++;
    this.state.namesVersion++;
    this.applySettings();
    this.emit(false);
  }

  /* ================= sync support (engine lives in src/persist/sync.ts) ================= */
  /** current local revision — advances on every successful save */
  get localRev(): number {
    return this.lastKnownRev;
  }

  /** the exact payload persisted locally; also what gets pushed to a sync server */
  persistedPayload(): { schemaVersion: number; vault: Vault; ui: UIState } {
    return { schemaVersion: SCHEMA_VERSION, vault: this.state.vault, ui: this.state.ui };
  }

  /**
   * Adopt state pulled from the sync server and write it through to
   * localStorage immediately — sibling tabs then converge via the storage
   * event, exactly as if another tab had saved.
   */
  adoptFromSync(normalized: { vault: Vault; ui: UIState }) {
    this.adoptState(normalized.vault, normalized.ui);
    this.savePending = true;
    this.flushSave();
  }

  /* ================= vault queries ================= */
  node(id: string | null | undefined): VaultNode | undefined {
    return id ? this.state.vault.nodes[id] : undefined;
  }
  allFiles(): VaultNode[] {
    return Object.values(this.state.vault.nodes).filter((n) => n.type === "file");
  }
  pathOf(id: string): VaultNode[] {
    const chain: VaultNode[] = [];
    let cur = this.node(id);
    while (cur) {
      chain.unshift(cur);
      cur = this.node(cur.parent);
    }
    return chain;
  }
  pathString(id: string): string {
    return this.pathOf(id).map((n) => n.name).join("/");
  }
  resolveByName(target: string): VaultNode | undefined {
    const name = normalize(target.split("#")[0].trim());
    if (!name) return undefined;
    if (!this.nameIndex || this.nameIndexVersion !== this.state.namesVersion) {
      this.nameIndex = new Map();
      this.nameIndexVersion = this.state.namesVersion;
      for (const f of this.allFiles()) {
        const key = normalize(f.name);
        if (!this.nameIndex.has(key)) this.nameIndex.set(key, f);
      }
    }
    return this.nameIndex.get(name);
  }
  childNames(parentId: string | null): Set<string> {
    const ids = parentId ? this.node(parentId)?.children ?? [] : this.state.vault.root;
    return new Set(ids.map((id) => this.node(id)?.name.toLowerCase() ?? ""));
  }
  uniqueName(parentId: string | null, base: string): string {
    const names = this.childNames(parentId);
    if (!names.has(base.toLowerCase())) return base;
    for (let i = 1; ; i++) {
      const candidate = `${base} ${i}`;
      if (!names.has(candidate.toLowerCase())) return candidate;
    }
  }

  /* ================= notices ================= */
  notice(msg: string, opts: { action?: Notice["action"]; sticky?: boolean } = {}): number {
    const id = noticeId++;
    const n: Notice = { id, msg };
    if (opts.action) n.action = opts.action;
    if (opts.sticky) n.sticky = true;
    this.state.notices = [...this.state.notices, n];
    this.emit(false);
    if (!n.sticky) window.setTimeout(() => this.dismissNotice(id), 4000);
    return id;
  }

  dismissNotice(id: number) {
    if (!this.state.notices.some((n) => n.id === id)) return;
    this.state.notices = this.state.notices.filter((n) => n.id !== id);
    this.emit(false);
  }

  /* ================= tabs / navigation ================= */
  get activeTab(): Tab | undefined {
    return this.state.ui.tabs.find((t) => t.id === this.state.ui.activeTab);
  }
  private touchRecents(fileId: string) {
    const ui = this.state.ui;
    ui.recents = [fileId, ...ui.recents.filter((r) => r !== fileId)].slice(0, 20);
  }

  openFile(fileId: string, opts: { newTab?: boolean; pending?: Partial<PendingNav> } = {}) {
    const file = this.node(fileId);
    if (!file || file.type !== "file") return;
    const ui = this.state.ui;
    let tab = opts.newTab ? undefined : this.activeTab;
    if (!tab) {
      tab = { id: genId("tab"), fileId: null, mode: "live", history: [], hIndex: -1 };
      ui.tabs = [...ui.tabs, tab];
      ui.activeTab = tab.id;
    }
    if (tab.fileId !== fileId) {
      tab.history = [...tab.history.slice(0, tab.hIndex + 1), fileId];
      tab.hIndex = tab.history.length - 1;
      tab.fileId = fileId;
    }
    ui.activeTab = tab.id;
    this.touchRecents(fileId);
    if (opts.pending) this.pending = { fileId, ...opts.pending };
    // reveal in tree: expand ancestors
    this.expandAncestors(fileId);
    this.emit();
  }

  newTab(fileId: string | null = null) {
    const ui = this.state.ui;
    const tab: Tab = {
      id: genId("tab"),
      fileId,
      mode: "live",
      history: fileId ? [fileId] : [],
      hIndex: fileId ? 0 : -1,
    };
    ui.tabs = [...ui.tabs, tab];
    ui.activeTab = tab.id;
    if (fileId) this.touchRecents(fileId);
    this.emit();
  }

  closeTab(tabId: string) {
    const ui = this.state.ui;
    const idx = ui.tabs.findIndex((t) => t.id === tabId);
    if (idx === -1) return;
    ui.tabs = ui.tabs.filter((t) => t.id !== tabId);
    if (ui.tabs.length === 0) {
      const tab: Tab = { id: genId("tab"), fileId: null, mode: "live", history: [], hIndex: -1 };
      ui.tabs = [tab];
      ui.activeTab = tab.id;
    } else if (ui.activeTab === tabId) {
      ui.activeTab = ui.tabs[Math.min(idx, ui.tabs.length - 1)].id;
    }
    this.emit();
  }

  activateTab(tabId: string) {
    this.state.ui.activeTab = tabId;
    this.emit();
  }

  /** Reorder tabs: move tabId to toIndex (its index in the list after removal). */
  moveTab(tabId: string, toIndex: number) {
    const ui = this.state.ui;
    const from = ui.tabs.findIndex((t) => t.id === tabId);
    if (from === -1) return;
    const tabs = [...ui.tabs];
    const [tab] = tabs.splice(from, 1);
    tabs.splice(Math.max(0, Math.min(toIndex, tabs.length)), 0, tab);
    if (tabs.indexOf(tab) === from) return; // landed where it started
    ui.tabs = tabs;
    this.emit();
  }

  setMode(tabId: string, mode: ViewMode) {
    const tab = this.state.ui.tabs.find((t) => t.id === tabId);
    if (tab) {
      tab.mode = mode;
      this.emit();
    }
  }

  canBack(): boolean {
    const t = this.activeTab;
    return !!t && t.hIndex > 0;
  }
  canForward(): boolean {
    const t = this.activeTab;
    return !!t && t.hIndex < t.history.length - 1;
  }
  back() {
    const t = this.activeTab;
    if (!t || t.hIndex <= 0) return;
    t.hIndex--;
    t.fileId = t.history[t.hIndex];
    this.emit();
  }
  forward() {
    const t = this.activeTab;
    if (!t || t.hIndex >= t.history.length - 1) return;
    t.hIndex++;
    t.fileId = t.history[t.hIndex];
    this.emit();
  }

  consumePending(fileId: string): PendingNav | null {
    if (this.pending && this.pending.fileId === fileId) {
      const p = this.pending;
      this.pending = null;
      return p;
    }
    return null;
  }

  /* ================= tree ================= */
  toggleExpand(id: string) {
    const ui = this.state.ui;
    ui.expanded = { ...ui.expanded, [id]: !ui.expanded[id] };
    this.emit();
  }
  collapseAll() {
    this.state.ui.expanded = {};
    this.emit();
  }
  setSort(sort: SortMode) {
    this.state.ui.sort = sort;
    this.emit();
  }
  /** copy-on-write so `ui.expanded` identity is a reliable memo key */
  private expandFolder(id: string) {
    if (!this.state.ui.expanded[id]) {
      this.state.ui.expanded = { ...this.state.ui.expanded, [id]: true };
    }
  }
  private expandAncestors(id: string) {
    const ui = this.state.ui;
    let expanded = ui.expanded;
    for (const anc of this.pathOf(id)) {
      if (anc.type === "folder" && !expanded[anc.id]) {
        if (expanded === ui.expanded) expanded = { ...expanded }; // copy-on-write
        expanded[anc.id] = true;
      }
    }
    ui.expanded = expanded;
  }

  /* ================= file ops ================= */
  createFile(parentId: string | null, name?: string, content = ""): string {
    const base = (name ?? "Untitled").trim() || "Untitled"; // never create empty/whitespace names
    const finalName = this.uniqueName(parentId, base);
    const id = genId("f");
    const node: VaultNode = { id, type: "file", name: finalName, parent: parentId, content };
    this.state.vault.nodes[id] = node;
    if (parentId) {
      const p = this.node(parentId)!;
      p.children = [...(p.children ?? []), id];
      this.expandFolder(parentId);
    } else {
      this.state.vault.root = [...this.state.vault.root, id];
    }
    this.state.namesVersion++;
    this.state.vaultVersion++;
    this.emit();
    return id;
  }

  createFolder(parentId: string | null): string {
    const finalName = this.uniqueName(parentId, "Untitled");
    const id = genId("d");
    const node: VaultNode = { id, type: "folder", name: finalName, parent: parentId, children: [] };
    this.state.vault.nodes[id] = node;
    if (parentId) {
      const p = this.node(parentId)!;
      p.children = [...(p.children ?? []), id];
      this.expandFolder(parentId);
    } else {
      this.state.vault.root = [...this.state.vault.root, id];
    }
    this.state.namesVersion++;
    this.state.vaultVersion++;
    this.emit();
    return id;
  }

  duplicateFile(id: string): string | null {
    const src = this.node(id);
    if (!src || src.type !== "file") return null;
    return this.createFile(src.parent, src.name, src.content ?? "");
  }

  moveNode(id: string, newParentId: string | null): boolean {
    const node = this.node(id);
    if (!node) return false;
    if (node.parent === newParentId) return false; // already there
    const target = newParentId ? this.node(newParentId) : null;
    if (newParentId && (!target || target.type !== "folder")) {
      this.notice("Can only move into a folder.");
      return false;
    }
    // reject cycles: the target must not be the node itself or live inside its subtree
    for (let cur: VaultNode | null | undefined = target; cur; cur = this.node(cur.parent)) {
      if (cur.id === id) {
        this.notice("Cannot move a folder into itself.");
        return false;
      }
    }
    if (this.childNames(newParentId).has(node.name.toLowerCase())) {
      this.notice(`A ${node.type} named "${node.name}" already exists there.`);
      return false;
    }
    if (node.parent) {
      const p = this.node(node.parent)!;
      p.children = (p.children ?? []).filter((c) => c !== id);
    } else {
      this.state.vault.root = this.state.vault.root.filter((c) => c !== id);
    }
    node.parent = newParentId;
    if (newParentId) {
      const p = this.node(newParentId)!;
      p.children = [...(p.children ?? []), id];
      this.expandFolder(newParentId);
    } else {
      this.state.vault.root = [...this.state.vault.root, id];
    }
    this.state.namesVersion++;
    this.state.vaultVersion++;
    this.emit();
    return true;
  }

  startRename(id: string) {
    this.state.renaming = id;
    this.emit(false);
  }
  cancelRename() {
    this.state.renaming = null;
    this.emit(false);
  }
  commitRename(id: string, rawName: string) {
    const node = this.node(id);
    this.state.renaming = null;
    if (!node) return this.emit(false);
    const name = rawName.trim().replace(/[/\\:]/g, "");
    if (!name || name === node.name) return this.emit(false);
    const siblings = this.childNames(node.parent);
    siblings.delete(node.name.toLowerCase());
    if (siblings.has(name.toLowerCase())) {
      this.notice(`A ${node.type} named "${name}" already exists.`);
      return this.emit(false);
    }
    const oldName = node.name;
    node.name = name;
    if (node.type === "file") {
      const updated = this.rewriteWikilinks(oldName, name);
      if (updated > 0) this.notice(`Updated links in ${updated} ${updated === 1 ? "note" : "notes"}.`);
    }
    this.state.namesVersion++;
    this.state.vaultVersion++;
    this.emit();
  }

  /** Rewrite inbound [[oldName]] / [[oldName#h]] / [[oldName|alias]] links (normalized
      name comparison, #heading and |alias parts preserved). Returns the note count. */
  private rewriteWikilinks(oldName: string, newName: string): number {
    const oldNorm = normalize(oldName.trim());
    if (!oldNorm) return 0;
    const re = /\[\[([^\]|#]+)((?:#[^\]|]*)?(?:\|[^\]]*)?)\]\]/g;
    let updated = 0;
    for (const f of this.allFiles()) {
      if (!f.content || !f.content.includes("[[")) continue;
      let changed = false;
      const next = f.content.replace(re, (full, target: string, rest: string) => {
        if (normalize(target.trim()) !== oldNorm) return full;
        changed = true;
        return `[[${newName}${rest}]]`;
      });
      if (changed) {
        f.content = next;
        updated++;
      }
    }
    return updated;
  }

  /** Soft delete: the subtree snapshot moves into vault.trash so it can be undone. */
  deleteNode(id: string) {
    const node = this.node(id);
    if (!node) return;
    const doomed = new Set<string>();
    const collect = (nid: string) => {
      doomed.add(nid);
      this.node(nid)?.children?.forEach(collect);
    };
    collect(id);
    const entry: TrashEntry = {
      entryId: genId("trash"),
      deletedAt: Date.now(),
      originalParent: node.parent,
      originalPath: this.pathString(id),
      rootId: id,
      nodes: [...doomed].map((nid) => this.node(nid)!),
    };
    if (node.parent) {
      const p = this.node(node.parent)!;
      p.children = (p.children ?? []).filter((c) => c !== id);
    } else {
      this.state.vault.root = this.state.vault.root.filter((c) => c !== id);
    }
    doomed.forEach((nid) => {
      delete this.state.vault.nodes[nid];
      this.searchNormCache.delete(nid);
    });
    this.state.vault.trash = [entry, ...this.state.vault.trash].slice(0, 50); // newest first, oldest dropped
    const ui = this.state.ui;
    ui.bookmarks = ui.bookmarks.filter((b) => !doomed.has(b));
    ui.recents = ui.recents.filter((r) => !doomed.has(r));
    for (const tab of ui.tabs) {
      const wasOpen = tab.fileId != null && doomed.has(tab.fileId);
      // shift hIndex by how many removed entries preceded it (clamping breaks Back/Forward)
      const removedBefore = tab.history.slice(0, tab.hIndex + 1).filter((h) => h != null && doomed.has(h)).length;
      tab.history = tab.history.filter((h) => h == null || !doomed.has(h));
      tab.hIndex = Math.min(tab.hIndex - removedBefore, tab.history.length - 1);
      if (wasOpen) tab.fileId = tab.history[tab.hIndex] ?? null;
    }
    this.state.namesVersion++;
    this.state.vaultVersion++;
    this.notice(`Deleted "${node.name}".`, {
      action: { label: "Undo", run: () => this.restoreTrash(entry.entryId) },
    });
    this.emit();
  }

  /* ================= trash ================= */
  trashEntries(): TrashEntry[] {
    return this.state.vault.trash;
  }

  restoreTrash(entryId: string): boolean {
    const entry = this.state.vault.trash.find((t) => t.entryId === entryId);
    if (!entry) return false;
    const rootNode = entry.nodes.find((n) => n.id === entry.rootId);
    if (!rootNode || entry.nodes.some((n) => this.state.vault.nodes[n.id])) {
      // ids resurfaced in the live tree (should not happen) — drop the entry rather than overwrite
      this.state.vault.trash = this.state.vault.trash.filter((t) => t.entryId !== entryId);
      this.emit();
      return false;
    }
    const parentId = entry.originalParent && this.node(entry.originalParent)?.type === "folder" ? entry.originalParent : null;
    rootNode.parent = parentId;
    rootNode.name = this.uniqueName(parentId, rootNode.name);
    for (const n of entry.nodes) this.state.vault.nodes[n.id] = n;
    if (parentId) {
      const p = this.node(parentId)!;
      p.children = [...(p.children ?? []), rootNode.id];
    } else {
      this.state.vault.root = [...this.state.vault.root, rootNode.id];
    }
    this.state.vault.trash = this.state.vault.trash.filter((t) => t.entryId !== entryId);
    this.expandAncestors(rootNode.id);
    this.state.namesVersion++;
    this.state.vaultVersion++;
    this.notice(`Restored "${rootNode.name}".`);
    this.emit();
    return true;
  }

  emptyTrash() {
    if (this.state.vault.trash.length === 0) return;
    this.state.vault.trash = [];
    this.state.vaultVersion++;
    this.notice("Trash emptied.");
    this.emit();
  }

  /* ================= content ================= */
  updateContent(fileId: string, content: string) {
    const node = this.node(fileId);
    if (!node || node.type !== "file" || node.content === content) return;
    node.content = content;
    this.state.vaultVersion++;
    this.emit();
  }

  toggleTaskAtLine(fileId: string, lineNo: number) {
    const node = this.node(fileId);
    if (!node || node.content == null) return;
    const lines = node.content.split("\n");
    if (lineNo < 0 || lineNo >= lines.length) return;
    // anchor to the list marker so a literal "[ ]" elsewhere in the line is never touched
    const m = /^(\s*(?:[-*+]|\d+[.)])\s+)\[( |[xX])\]/.exec(lines[lineNo]);
    if (!m) return;
    const box = m[2] === " " ? "[x]" : "[ ]";
    lines[lineNo] = m[1] + box + lines[lineNo].slice(m[0].length);
    node.content = lines.join("\n");
    this.state.vaultVersion++;
    this.emit();
  }

  /* ================= wikilinks ================= */
  openWikilink(target: string, currentFileId: string | null, opts: { newTab?: boolean } = {}) {
    const hashIdx = target.indexOf("#");
    const namePart = (hashIdx === -1 ? target : target.slice(0, hashIdx)).trim();
    const headingPart = hashIdx === -1 ? "" : target.slice(hashIdx + 1).trim();
    if (!namePart) {
      // "[[#heading]]" targets a heading in the current note — never create a junk note for it
      if (headingPart && currentFileId && this.node(currentFileId)?.type === "file") {
        this.openFile(currentFileId, { newTab: opts.newTab, pending: { heading: headingPart } });
      }
      return;
    }
    let file = this.resolveByName(namePart);
    if (!file) {
      const parent = currentFileId ? this.node(currentFileId)?.parent ?? null : null;
      const id = this.createFile(parent, namePart);
      this.notice(`Created "${namePart}".`);
      file = this.node(id);
    }
    if (file) {
      this.openFile(file.id, {
        newTab: opts.newTab,
        pending: headingPart ? { heading: headingPart } : undefined,
      });
    }
  }

  backlinksFor(fileId: string): { file: VaultNode; lines: string[]; mentions: { text: string; line: number }[] }[] {
    const me = this.node(fileId);
    if (!me) return [];
    const myName = normalize(me.name);
    const out: { file: VaultNode; lines: string[]; mentions: { text: string; line: number }[] }[] = [];
    for (const f of this.allFiles()) {
      if (f.id === fileId || !f.content) continue;
      const lines: string[] = [];
      const mentions: { text: string; line: number }[] = [];
      const fileLines = f.content.split("\n");
      for (let i = 0; i < fileLines.length; i++) {
        const line = fileLines[i];
        const re = /\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\|[^\]]*)?\]\]/g;
        let m: RegExpExecArray | null;
        while ((m = re.exec(line))) {
          if (normalize(m[1].trim()) === myName) {
            lines.push(line.trim());
            mentions.push({ text: line.trim(), line: i });
            break;
          }
        }
      }
      if (lines.length) out.push({ file: f, lines, mentions });
    }
    return out;
  }

  /* ================= search ================= */
  private normFor(file: VaultNode): { norm: string; map: number[] } {
    const content = file.content ?? "";
    const hit = this.searchNormCache.get(file.id);
    if (hit && hit.content === content) return hit;
    const entry = { content, ...normalizeWithMap(content) };
    this.searchNormCache.set(file.id, entry);
    return entry;
  }

  search(query: string): SearchMatch[] {
    const q = normalize(query);
    if (!q) return [];
    const results: SearchMatch[] = [];
    for (const f of this.allFiles()) {
      const content = f.content ?? "";
      const { norm, map } = this.normFor(f);
      let idx = 0;
      while (results.length < 250) {
        idx = norm.indexOf(q, idx);
        if (idx === -1) break;
        const from = map[idx];
        // end = original index of the next kept char (covers chars the normalizer dropped),
        // then swallow trailing diacritics so the highlight never splits a grapheme
        let to = map[idx + q.length] ?? content.length;
        while (to < content.length && DIACRITICS.test(content[to])) to++;
        const lineStart = content.lastIndexOf("\n", from - 1) + 1;
        let lineEnd = content.indexOf("\n", from);
        if (lineEnd === -1) lineEnd = content.length;
        results.push({ fileId: f.id, from, to, lineText: content.slice(lineStart, lineEnd), lineStart });
        idx += q.length;
      }
      if (results.length >= 250) break;
    }
    return results;
  }

  /* ================= bookmarks ================= */
  toggleBookmark(fileId: string) {
    const ui = this.state.ui;
    if (ui.bookmarks.includes(fileId)) {
      ui.bookmarks = ui.bookmarks.filter((b) => b !== fileId);
      this.notice("Bookmark removed.");
    } else {
      ui.bookmarks = [...ui.bookmarks, fileId];
      this.notice("Bookmark added.");
    }
    this.emit();
  }

  /* ================= layout ================= */
  setLeftTab(tab: LeftTab) {
    this.state.ui.leftTab = tab;
    this.state.ui.leftOpen = true;
    this.emit();
  }
  toggleLeft() {
    this.state.ui.leftOpen = !this.state.ui.leftOpen;
    this.emit();
  }
  toggleRight() {
    this.state.ui.rightOpen = !this.state.ui.rightOpen;
    this.emit();
  }
  setRightTab(tab: RightTab) {
    this.state.ui.rightTab = tab;
    this.emit();
  }
  setLeftWidth(w: number) {
    this.state.ui.leftWidth = Math.max(200, Math.min(560, w));
    this.emit();
  }
  setRightWidth(w: number) {
    this.state.ui.rightWidth = Math.max(200, Math.min(520, w));
    this.emit();
  }

  /* ================= settings ================= */
  setSetting(patch: Partial<Settings>) {
    this.state.ui.settings = { ...this.state.ui.settings, ...patch };
    this.applySettings();
    this.emit();
  }

  /** Push the current settings into CSS custom properties (on boot and on every change).
      `spellcheck` has no CSS hook — the editor reads it from ui.settings directly. */
  private applySettings() {
    const s = this.state.ui.settings;
    const el = document.documentElement;
    el.style.setProperty("--editor-font-size", `${s.fontSize}px`);
    el.style.setProperty("--content-width", `${s.lineWidth}px`);
    el.style.setProperty("--accent", s.accent);
    el.style.setProperty("--link-color", s.accent);
  }

  /* ================= import (used by src/export.ts) ================= */
  /** Replace the whole vault+ui in memory and persist immediately.
      Callers must pass data that went through normalizeVaultData(). */
  importData(vault: Vault, ui: UIState) {
    this.state.vault = vault;
    this.state.ui = ui;
    this.pending = null;
    this.state.renaming = null;
    this.searchNormCache.clear();
    this.nameIndex = null;
    this.state.vaultVersion++;
    this.state.namesVersion++;
    this.applySettings();
    this.emit();
    this.flushSave();
  }

  /* ================= modal ================= */
  setModal(modal: ModalState) {
    this.state.modal = modal;
    this.emit(false);
  }
}

export const store = new Store();

export function useApp(): AppState {
  return useSyncExternalStore(store.subscribe, store.get);
}
