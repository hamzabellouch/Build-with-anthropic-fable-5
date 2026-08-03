import { useEffect, useMemo, useRef, useState } from "react";
import { FilePlus2, Folder, X } from "lucide-react";
import { normalize, store, useApp } from "../store";
import { fuzzyScoreNorm } from "../fuzzy";
import { importVaultJSON } from "../export";
import { syncEngine, useSync } from "../persist/sync";
import type { SyncSnapshot } from "../persist/sync";
import type { Command } from "../types";
import { exportJSON, exportZip, focusEditorSoon, pickImportFile } from "./actions";

/** Every modal closes through here so focus always returns to the editor. */
function closeModal() {
  store.setModal(null);
  focusEditorSoon();
}

function Backdrop({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {children}
    </div>
  );
}

/* ------------------- quick switcher ------------------- */
function QuickSwitcher() {
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  useEffect(() => inputRef.current?.focus(), []);

  // names/paths normalized ONCE per modal open; queries then only pay fuzzyScoreNorm
  const candidates = useMemo(
    () =>
      store.allFiles().map((f) => ({
        f,
        parentPath: store.pathOf(f.id).slice(0, -1).map((n) => n.name).join("/"),
        normName: normalize(f.name),
        normPath: normalize(store.pathString(f.id)),
      })),
    []
  );

  const items = useMemo(() => {
    if (!q.trim()) {
      const byId = new Map(candidates.map((c) => [c.f.id, c]));
      const recents = store.state.ui.recents
        .map((id) => byId.get(id))
        .filter((c): c is (typeof candidates)[number] => c != null);
      const rest = candidates.filter((c) => !recents.includes(c));
      return [...recents, ...rest].slice(0, 30);
    }
    const nq = normalize(q);
    return candidates
      .map((c) => ({ c, score: Math.max(fuzzyScoreNorm(nq, c.normName), fuzzyScoreNorm(nq, c.normPath) - 1) }))
      .filter((x) => x.score >= 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 30)
      .map((x) => x.c);
  }, [q, candidates]);

  const choose = (idx: number, newTab: boolean) => {
    const item = items[idx];
    if (item) {
      store.openFile(item.f.id, { newTab });
      closeModal();
    } else if (q.trim()) {
      const id = store.createFile(null, q.trim());
      store.openFile(id, { newTab });
      store.notice(`Created "${q.trim()}".`);
      closeModal();
    }
  };

  useEffect(() => {
    setSel(0);
  }, [q]);
  useEffect(() => {
    listRef.current
      ?.querySelectorAll(".prompt-item")
      [sel]?.scrollIntoView({ block: "nearest" });
  }, [sel]);

  return (
    <Backdrop onClose={closeModal}>
      <div className="prompt">
        <input
          ref={inputRef}
          className="prompt-input"
          placeholder="Find or create a note..."
          value={q}
          dir="auto"
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setSel((s) => Math.min(s + 1, Math.max(items.length - 1, 0)));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setSel((s) => Math.max(s - 1, 0));
            } else if (e.key === "Enter") {
              e.preventDefault();
              choose(sel, e.ctrlKey || e.metaKey);
            } else if (e.key === "Escape") {
              closeModal();
            }
          }}
        />
        <div className="prompt-results" ref={listRef}>
          {items.map((c, i) => (
            <div
              key={c.f.id}
              className={"prompt-item" + (i === sel ? " is-selected" : "")}
              onMouseMove={() => setSel(i)}
              onClick={(e) => choose(i, e.ctrlKey || e.metaKey)}
            >
              <span className="label" dir="auto">{c.f.name}</span>
              <span className="prompt-path" dir="auto">{c.parentPath}</span>
            </div>
          ))}
          {items.length === 0 && q.trim() && (
            <div className="prompt-item is-selected" onClick={() => choose(0, false)}>
              <FilePlus2 size={15} />
              <span className="label" dir="auto">Create "{q.trim()}"</span>
            </div>
          )}
        </div>
        <div className="prompt-instructions">
          <span><kbd>↑↓</kbd> to navigate</span>
          <span><kbd>↵</kbd> to open</span>
          <span><kbd>ctrl ↵</kbd> to open in new tab</span>
          <span><kbd>esc</kbd> to dismiss</span>
        </div>
      </div>
    </Backdrop>
  );
}

/* ------------------- command palette ------------------- */
function buildCommands(): Command[] {
  const toggleMode = () => {
    const tab = store.activeTab;
    if (tab) store.setMode(tab.id, tab.mode === "live" ? "reading" : "live");
  };
  return [
    {
      id: "new-note",
      label: "Create new note",
      hotkey: "Alt + N",
      run: () => {
        const id = store.createFile(null);
        store.openFile(id);
        store.startRename(id);
      },
    },
    { id: "new-folder", label: "Create new folder", run: () => {
        const id = store.createFolder(null);
        store.setLeftTab("files");
        store.startRename(id);
      } },
    { id: "switcher", label: "Quick switcher: Open quick switcher", hotkey: "Ctrl + O", run: () => store.setModal({ type: "switcher" }) },
    { id: "reading", label: "Toggle reading view", hotkey: "Ctrl + E", run: toggleMode },
    { id: "new-tab", label: "Open new tab", hotkey: "Alt + T", run: () => store.newTab() },
    { id: "close-tab", label: "Close current tab", hotkey: "Alt + W", run: () => store.closeTab(store.state.ui.activeTab) },
    { id: "left", label: "Toggle left sidebar", run: () => store.toggleLeft() },
    { id: "right", label: "Toggle right sidebar", run: () => store.toggleRight() },
    { id: "collapse", label: "Files: Collapse all", run: () => store.collapseAll() },
    { id: "search", label: "Search: Search in all files", hotkey: "Ctrl + Shift + F", run: () => store.setLeftTab("search") },
    {
      id: "bookmark",
      label: "Bookmarks: Bookmark current file",
      run: () => {
        const f = store.activeTab?.fileId;
        if (f) store.toggleBookmark(f);
      },
    },
    { id: "settings", label: "Open settings", run: () => store.setModal({ type: "settings" }) },
    { id: "trash", label: `Open trash (${store.trashEntries().length})`, run: () => store.setModal({ type: "trash" }) },
    { id: "export-zip", label: "Export vault (Markdown .zip)", run: exportZip },
    { id: "export-json", label: "Download JSON backup", run: exportJSON },
    { id: "import-json", label: "Import JSON backup...", run: pickImportFile },
    {
      id: "delete",
      label: "Delete current file",
      run: () => {
        const f = store.activeTab?.fileId;
        if (f) store.setModal({ type: "confirmDelete", id: f });
      },
    },
  ];
}

function CommandPalette() {
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => inputRef.current?.focus(), []);
  // built (and labels normalized) once per palette open
  const commands = useMemo(buildCommands, []);
  const normed = useMemo(() => commands.map((c) => ({ c, norm: normalize(c.label) })), [commands]);

  const items = useMemo(() => {
    if (!q.trim()) return commands;
    const nq = normalize(q);
    return normed
      .map((x) => ({ c: x.c, score: fuzzyScoreNorm(nq, x.norm) }))
      .filter((x) => x.score >= 0)
      .sort((a, b) => b.score - a.score)
      .map((x) => x.c);
  }, [q, commands, normed]);

  useEffect(() => setSel(0), [q]);
  const run = (idx: number) => {
    const cmd = items[idx];
    if (!cmd) return;
    closeModal();
    cmd.run();
  };

  return (
    <Backdrop onClose={closeModal}>
      <div className="prompt">
        <input
          ref={inputRef}
          className="prompt-input"
          placeholder="Select a command..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setSel((s) => Math.min(s + 1, items.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setSel((s) => Math.max(s - 1, 0));
            } else if (e.key === "Enter") {
              e.preventDefault();
              run(sel);
            } else if (e.key === "Escape") {
              closeModal();
            }
          }}
        />
        <div className="prompt-results">
          {items.map((c, i) => (
            <div
              key={c.id}
              className={"prompt-item" + (i === sel ? " is-selected" : "")}
              onMouseMove={() => setSel(i)}
              onClick={() => run(i)}
            >
              <span className="label">{c.label}</span>
              {c.hotkey && <span className="prompt-hotkey">{c.hotkey}</span>}
            </div>
          ))}
          {items.length === 0 && <div className="pane-empty">No matching commands.</div>}
        </div>
        <div className="prompt-instructions">
          <span><kbd>↑↓</kbd> to navigate</span>
          <span><kbd>↵</kbd> to use</span>
          <span><kbd>esc</kbd> to dismiss</span>
        </div>
      </div>
    </Backdrop>
  );
}

/* ------------------- move to folder ------------------- */
function MoveToModal({ id }: { id: string }) {
  const node = store.node(id);
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  useEffect(() => inputRef.current?.focus(), []);

  // all folders except the node itself and its descendants, plus the vault root
  const candidates = useMemo(() => {
    const inSubtree = (folderId: string): boolean => {
      for (let cur = store.node(folderId); cur; cur = store.node(cur.parent)) {
        if (cur.id === id) return true;
      }
      return false;
    };
    const folders = Object.values(store.state.vault.nodes)
      .filter((n) => n.type === "folder" && !inSubtree(n.id))
      .map((n) => {
        const path = store.pathString(n.id);
        return { id: n.id as string | null, path, norm: normalize(path) };
      })
      .sort((a, b) => a.path.localeCompare(b.path));
    return [{ id: null, path: "/", norm: "/" }, ...folders];
  }, [id]);

  const items = useMemo(() => {
    if (!q.trim()) return candidates;
    const nq = normalize(q);
    return candidates
      .map((c) => ({ c, score: fuzzyScoreNorm(nq, c.norm) }))
      .filter((x) => x.score >= 0)
      .sort((a, b) => b.score - a.score)
      .map((x) => x.c);
  }, [q, candidates]);

  useEffect(() => setSel(0), [q]);
  useEffect(() => {
    listRef.current
      ?.querySelectorAll(".prompt-item")
      [sel]?.scrollIntoView({ block: "nearest" });
  }, [sel]);

  const choose = (idx: number) => {
    const item = items[idx];
    if (!item) return;
    store.moveNode(id, item.id); // failures (name collision, ...) raise a notice
    closeModal();
  };

  if (!node) return null;
  return (
    <Backdrop onClose={closeModal}>
      <div className="prompt">
        <input
          ref={inputRef}
          className="prompt-input"
          placeholder={`Move "${node.name}" to folder...`}
          value={q}
          dir="auto"
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setSel((s) => Math.min(s + 1, Math.max(items.length - 1, 0)));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setSel((s) => Math.max(s - 1, 0));
            } else if (e.key === "Enter") {
              e.preventDefault();
              choose(sel);
            } else if (e.key === "Escape") {
              closeModal();
            }
          }}
        />
        <div className="prompt-results" ref={listRef}>
          {items.map((c, i) => (
            <div
              key={c.id ?? "__root__"}
              className={"prompt-item" + (i === sel ? " is-selected" : "")}
              onMouseMove={() => setSel(i)}
              onClick={() => choose(i)}
            >
              <Folder size={15} />
              <span className="label" dir="auto">{c.path}</span>
            </div>
          ))}
          {items.length === 0 && <div className="pane-empty">No matching folders.</div>}
        </div>
        <div className="prompt-instructions">
          <span><kbd>↑↓</kbd> to navigate</span>
          <span><kbd>↵</kbd> to move</span>
          <span><kbd>esc</kbd> to dismiss</span>
        </div>
      </div>
    </Backdrop>
  );
}

/* ------------------- settings ------------------- */
const ACCENT_PRESETS = ["#8a7cf0", "#7aa2f7", "#2ea8a3", "#5cbf60", "#e0a23f", "#e0565e", "#d864c8"];

function syncStatusLine(s: SyncSnapshot): string {
  switch (s.status) {
    case "off":
      return "Sync is off.";
    case "syncing":
      return "Syncing…";
    case "synced":
      return `Synced · rev ${s.remoteRev}` + (s.lastSyncAt ? ` · ${new Date(s.lastSyncAt).toLocaleTimeString()}` : "");
    case "unreachable":
      return "Server unreachable — working locally; retries automatically.";
    case "error":
      return s.detail || "Sync error.";
  }
}

function SettingsModal() {
  const state = useApp();
  const s = state.ui.settings;
  const sync = useSync();
  const dialogRef = useRef<HTMLDivElement>(null);
  useEffect(() => dialogRef.current?.focus(), []);
  const colorValue = /^#[0-9a-fA-F]{6}$/.test(s.accent) ? s.accent : "#8a7cf0";

  return (
    <Backdrop onClose={closeModal}>
      <div
        className="dialog settings-dialog"
        ref={dialogRef}
        tabIndex={-1}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.stopPropagation();
            closeModal();
          }
        }}
      >
        <div className="dialog-titlebar">
          <h3>Settings</h3>
          <button className="clickable-icon" title="Close" onClick={closeModal}>
            <X />
          </button>
        </div>

        <div className="setting-row">
          <div className="setting-info">
            <div className="setting-name">Editor font size</div>
            <div className="setting-desc">Applies live to the editor and reading view.</div>
          </div>
          <div className="setting-control">
            <input
              type="range"
              min={14}
              max={22}
              step={0.5}
              value={s.fontSize}
              onChange={(e) => store.setSetting({ fontSize: Number(e.target.value) })}
            />
            <span className="setting-value">{s.fontSize}px</span>
          </div>
        </div>

        <div className="setting-row">
          <div className="setting-info">
            <div className="setting-name">Line width</div>
            <div className="setting-desc">Maximum width of a line of text.</div>
          </div>
          <div className="setting-control">
            <input
              type="range"
              min={640}
              max={1600}
              step={20}
              value={s.lineWidth}
              onChange={(e) => store.setSetting({ lineWidth: Number(e.target.value) })}
            />
            <span className="setting-value">{s.lineWidth}px</span>
          </div>
        </div>

        <div className="setting-row">
          <div className="setting-info">
            <div className="setting-name">Accent color</div>
            <div className="setting-desc">Used for links, selections and highlights.</div>
          </div>
          <div className="setting-control accent-swatches">
            {ACCENT_PRESETS.map((color) => (
              <button
                key={color}
                className={"accent-swatch" + (s.accent.toLowerCase() === color ? " is-selected" : "")}
                style={{ background: color }}
                title={color}
                onClick={() => store.setSetting({ accent: color })}
              />
            ))}
            <input
              type="color"
              className="accent-color-input"
              title="Custom color"
              value={colorValue}
              onChange={(e) => store.setSetting({ accent: e.target.value })}
            />
          </div>
        </div>

        <div className="setting-row">
          <div className="setting-info">
            <div className="setting-name">Spellcheck</div>
            <div className="setting-desc">Browser spellchecking while editing notes.</div>
          </div>
          <div className="setting-control">
            <button
              className={"toggle" + (s.spellcheck ? " is-on" : "")}
              role="switch"
              aria-checked={s.spellcheck}
              aria-label="Spellcheck"
              onClick={() => store.setSetting({ spellcheck: !s.spellcheck })}
            >
              <span className="toggle-thumb" />
            </button>
          </div>
        </div>

        <div className="setting-row">
          <div className="setting-info">
            <div className="setting-name">Sync to database</div>
            <div className="setting-desc">
              Mirror the vault to the bundled sync server (SQLite or Postgres). Notes always save
              locally first and keep working offline.
            </div>
          </div>
          <div className="setting-control">
            <button
              className={"toggle" + (sync.enabled ? " is-on" : "")}
              role="switch"
              aria-checked={sync.enabled}
              aria-label="Sync to database"
              onClick={() => syncEngine.setConfig({ enabled: !sync.enabled })}
            >
              <span className="toggle-thumb" />
            </button>
          </div>
        </div>

        {sync.enabled && (
          <div className="setting-row">
            <div className="setting-info">
              <div className="setting-name">Sync server</div>
              <div className="setting-desc">{syncStatusLine(sync)}</div>
            </div>
            <div className="setting-control">
              <input
                key={sync.url}
                type="text"
                className="sync-url-input"
                defaultValue={sync.url}
                spellCheck={false}
                aria-label="Sync server URL"
                onBlur={(e) => {
                  const next = e.target.value.trim();
                  if (next !== sync.url) syncEngine.setConfig({ url: next });
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                }}
              />
              <button className="btn" onClick={() => syncEngine.kick()}>
                Sync now
              </button>
            </div>
          </div>
        )}
      </div>
    </Backdrop>
  );
}

/* ------------------- trash ------------------- */
function relTime(ts: number): string {
  const s = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d} d ago`;
  return new Date(ts).toLocaleDateString();
}

function TrashModal() {
  useApp(); // re-render when entries are restored / emptied
  const entries = store.trashEntries();
  const [confirmingEmpty, setConfirmingEmpty] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  useEffect(() => dialogRef.current?.focus(), []);

  return (
    <Backdrop onClose={closeModal}>
      <div
        className="dialog trash-dialog"
        ref={dialogRef}
        tabIndex={-1}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.stopPropagation();
            closeModal();
          }
        }}
      >
        <div className="dialog-titlebar">
          <h3>Trash</h3>
          <button className="clickable-icon" title="Close" onClick={closeModal}>
            <X />
          </button>
        </div>
        {entries.length === 0 ? (
          <div className="pane-empty">Trash is empty.</div>
        ) : (
          <div className="trash-list">
            {entries.map((t) => {
              const root = t.nodes.find((n) => n.id === t.rootId);
              return (
                <div className="trash-row" key={t.entryId}>
                  <div className="trash-meta">
                    <div className="trash-name" dir="auto">{root?.name ?? "Untitled"}</div>
                    <div className="trash-path" dir="auto">
                      {t.originalPath || root?.name} · {relTime(t.deletedAt)}
                    </div>
                  </div>
                  <button
                    className="btn"
                    onClick={() => {
                      store.restoreTrash(t.entryId);
                      dialogRef.current?.focus(); // the row may unmount — keep Escape working
                    }}
                  >
                    Restore
                  </button>
                </div>
              );
            })}
          </div>
        )}
        {entries.length > 0 && (
          <div className="dialog-buttons trash-footer">
            {confirmingEmpty ? (
              <>
                <span className="trash-confirm-label">
                  Permanently delete {entries.length} item{entries.length === 1 ? "" : "s"}?
                </span>
                <button className="btn" onClick={() => setConfirmingEmpty(false)}>Cancel</button>
                <button
                  className="btn danger"
                  onClick={() => {
                    store.emptyTrash();
                    setConfirmingEmpty(false);
                    dialogRef.current?.focus();
                  }}
                >
                  Empty trash
                </button>
              </>
            ) : (
              <button className="btn danger" onClick={() => setConfirmingEmpty(true)}>
                Empty trash
              </button>
            )}
          </div>
        )}
      </div>
    </Backdrop>
  );
}

/* ------------------- delete confirm ------------------- */
/* Enter must never confirm from "anywhere": the Delete button is focused and
   native button semantics decide — Enter on Cancel cancels. Escape is scoped
   to the dialog (no window-level listener). */
function ConfirmDelete({ id }: { id: string }) {
  const node = store.node(id);
  if (!node) return null;
  return (
    <Backdrop onClose={closeModal}>
      <div
        className="dialog"
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.stopPropagation();
            closeModal();
          }
        }}
      >
        <h3 dir="auto">Delete {node.type === "folder" ? "folder" : "file"} "{node.name}"?</h3>
        <p>
          {node.type === "folder"
            ? "The folder and all its contents will be moved to the trash."
            : "It will be moved to the trash. You can undo this right away or restore it later."}
        </p>
        <div className="dialog-buttons">
          <button className="btn" onClick={closeModal}>Cancel</button>
          <button
            className="btn danger"
            autoFocus
            onClick={() => {
              store.deleteNode(id);
              closeModal();
            }}
          >
            Delete
          </button>
        </div>
      </div>
    </Backdrop>
  );
}

/* ------------------- import confirm ------------------- */
function ConfirmImport({ file }: { file: File }) {
  const [busy, setBusy] = useState(false);
  return (
    <Backdrop onClose={closeModal}>
      <div
        className="dialog"
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.stopPropagation();
            closeModal();
          }
        }}
      >
        <h3>Import vault backup?</h3>
        <p dir="auto">
          This replaces the ENTIRE current vault with the contents of "{file.name}". A copy of the
          current vault is kept in browser storage, but export it first if it matters.
        </p>
        <div className="dialog-buttons">
          <button className="btn" autoFocus onClick={closeModal}>Cancel</button>
          <button
            className="btn danger"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              await importVaultJSON(store, file);
              closeModal();
            }}
          >
            {busy ? "Importing..." : "Replace vault"}
          </button>
        </div>
      </div>
    </Backdrop>
  );
}

export function Modals() {
  const state = useApp();
  if (!state.modal) return null;
  if (state.modal.type === "switcher") return <QuickSwitcher />;
  if (state.modal.type === "palette") return <CommandPalette />;
  if (state.modal.type === "confirmDelete") return <ConfirmDelete id={state.modal.id} />;
  if (state.modal.type === "settings") return <SettingsModal />;
  if (state.modal.type === "trash") return <TrashModal />;
  if (state.modal.type === "moveTo") return <MoveToModal id={state.modal.id} />;
  if (state.modal.type === "confirmImport") return <ConfirmImport file={state.modal.file} />;
  return null;
}
