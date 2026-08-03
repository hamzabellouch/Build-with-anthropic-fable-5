import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronDown, Files, Youtube, BookOpenText, CheckCheck, Lightbulb, Briefcase,
  FilePlus2, FolderPlus, PencilLine, Trash2, Bookmark, ExternalLink, Folder,
  FolderInput, CopyPlus, Link,
} from "lucide-react";
import type { NodeType, VaultNode } from "../types";
import { store, useApp } from "../store";
import { openMenu } from "./ContextMenu";
import { copyObsidianLink } from "./actions";

const FOLDER_ICONS: Record<string, any> = {
  files: Files,
  youtube: Youtube,
  "book-open-text": BookOpenText,
  "check-check": CheckCheck,
  lightbulb: Lightbulb,
  briefcase: Briefcase,
  folder: Folder,
};

const INDENT_BASE = 8; // .tree-item-self inline padding in app.css
const INDENT_STEP = 19; // matches the old nested .tree-children indent

function sortIds(ids: string[]): string[] {
  const sort = store.state.ui.sort;
  if (sort === "custom") return ids;
  const sorted = [...ids].sort((a, b) => {
    const na = store.node(a)!;
    const nb = store.node(b)!;
    if (na.type !== nb.type) return na.type === "folder" ? -1 : 1;
    const cmp = na.name.localeCompare(nb.name);
    return sort === "az" ? cmp : -cmp;
  });
  return sorted;
}

function fileMenu(node: VaultNode, e: React.MouseEvent) {
  e.preventDefault();
  e.stopPropagation();
  const bookmarked = store.state.ui.bookmarks.includes(node.id);
  openMenu(
    { x: e.clientX, y: e.clientY },
    [
      { label: "Open in new tab", icon: <ExternalLink />, action: () => store.openFile(node.id, { newTab: true }) },
      {
        label: bookmarked ? "Remove bookmark" : "Bookmark...",
        icon: <Bookmark />,
        action: () => store.toggleBookmark(node.id),
      },
      "sep",
      { label: "Copy Obsidian link", icon: <Link />, action: () => copyObsidianLink(node.name) },
      {
        label: "Duplicate",
        icon: <CopyPlus />,
        action: () => {
          const copy = store.duplicateFile(node.id);
          if (copy) store.openFile(copy);
        },
      },
      { label: "Move to...", icon: <FolderInput />, action: () => store.setModal({ type: "moveTo", id: node.id }) },
      "sep",
      { label: "Rename...", icon: <PencilLine />, action: () => store.startRename(node.id) },
      { label: "Delete", icon: <Trash2 />, danger: true, action: () => store.setModal({ type: "confirmDelete", id: node.id }) },
    ]
  );
}

function folderMenu(node: VaultNode, e: React.MouseEvent) {
  e.preventDefault();
  e.stopPropagation();
  openMenu(
    { x: e.clientX, y: e.clientY },
    [
      {
        label: "New note",
        icon: <FilePlus2 />,
        action: () => {
          const id = store.createFile(node.id);
          store.openFile(id);
          store.startRename(id);
        },
      },
      {
        label: "New folder",
        icon: <FolderPlus />,
        action: () => {
          const id = store.createFolder(node.id);
          store.startRename(id);
        },
      },
      "sep",
      { label: "Move to...", icon: <FolderInput />, action: () => store.setModal({ type: "moveTo", id: node.id }) },
      "sep",
      { label: "Rename...", icon: <PencilLine />, action: () => store.startRename(node.id) },
      { label: "Delete", icon: <Trash2 />, danger: true, action: () => store.setModal({ type: "confirmDelete", id: node.id }) },
    ]
  );
}

/** Is `folderId` (or the root, when null) a legal drop target for `draggedId`?
    Rejects dropping a node onto itself or into its own subtree — the store
    validates again, this guard just keeps the UI honest while dragging. */
function canDropInto(draggedId: string, folderId: string | null): boolean {
  if (draggedId === folderId) return false;
  for (let cur = folderId ? store.node(folderId) : undefined; cur; cur = store.node(cur.parent)) {
    if (cur.id === draggedId) return false;
  }
  return true;
}

function RenameInput({ id, name }: { id: string; name: string }) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    ref.current?.focus();
    ref.current?.select();
  }, []);
  return (
    <input
      ref={ref}
      className="tree-rename-input"
      defaultValue={name}
      dir="auto"
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => {
        e.stopPropagation();
        if (e.key === "Enter") store.commitRename(id, (e.target as HTMLInputElement).value);
        else if (e.key === "Escape") store.cancelRename();
      }}
      onBlur={(e) => store.commitRename(id, e.target.value)}
    />
  );
}

/* ---------- flat visible rows ----------
 * The whole visible tree is computed as one flat array in FileTree and
 * rendered through this memo'd row that only receives primitives — the
 * store mutates nested objects in place, so object identity is never
 * used as a memo key (ui.expanded, which is copy-on-write, excepted). */

interface RowHandlers {
  onRowClick: (id: string, type: NodeType, e: React.MouseEvent) => void;
  onRowAuxClick: (id: string, type: NodeType, e: React.MouseEvent) => void;
  onRowContextMenu: (id: string, e: React.MouseEvent) => void;
  onRowDragStart: (id: string, e: React.DragEvent) => void;
  onRowDragOver: (id: string, type: NodeType, e: React.DragEvent) => void;
  onRowDragLeave: (id: string, e: React.DragEvent) => void;
  onRowDrop: (id: string, type: NodeType, e: React.DragEvent) => void;
  onRowDragEnd: () => void;
}

interface TreeRowProps extends RowHandlers {
  id: string;
  type: NodeType;
  name: string;
  depth: number;
  expanded: boolean;
  icon: string | undefined;
  color: string | undefined;
  isActive: boolean;
  isCursor: boolean;
  isDrop: boolean;
  renaming: boolean;
}

const TreeRow = memo(function TreeRow(p: TreeRowProps) {
  const Icon = p.type === "folder" && p.icon ? FOLDER_ICONS[p.icon] : null;
  const indent = INDENT_BASE + p.depth * INDENT_STEP;
  return (
    <div
      className={
        "tree-item-self" +
        (p.isActive ? " is-active" : "") +
        (p.isCursor ? " is-cursor" : "") +
        (p.isDrop ? " is-drop" : "")
      }
      data-id={p.id}
      style={{ paddingInlineStart: indent, "--tree-indent": `${indent}px` } as React.CSSProperties}
      draggable={!p.renaming}
      onClick={(e) => p.onRowClick(p.id, p.type, e)}
      onAuxClick={(e) => p.onRowAuxClick(p.id, p.type, e)}
      onContextMenu={(e) => p.onRowContextMenu(p.id, e)}
      onDragStart={(e) => p.onRowDragStart(p.id, e)}
      onDragOver={(e) => p.onRowDragOver(p.id, p.type, e)}
      onDragLeave={(e) => p.onRowDragLeave(p.id, e)}
      onDrop={(e) => p.onRowDrop(p.id, p.type, e)}
      onDragEnd={() => p.onRowDragEnd()}
    >
      <span className={"tree-chevron" + (p.type === "folder" ? (p.expanded ? "" : " is-collapsed") : " placeholder")}>
        <ChevronDown />
      </span>
      {Icon && (
        <span className="tree-icon" style={p.color ? { color: p.color } : undefined}>
          <Icon />
        </span>
      )}
      {p.renaming ? <RenameInput id={p.id} name={p.name} /> : <span className="tree-name" dir="auto">{p.name}</span>}
    </div>
  );
});

interface RowData {
  id: string;
  type: NodeType;
  name: string;
  depth: number;
  parent: string | null;
  expanded: boolean;
  icon: string | undefined;
  color: string | undefined;
}

const HOVER_EXPAND_MS = 600;

export function FileTree() {
  const state = useApp();
  const activeTab = state.ui.tabs.find((t) => t.id === state.ui.activeTab);
  const activeFileId = activeTab?.fileId ?? null;
  const expanded = state.ui.expanded;

  // keyboard cursor + current drop target ("" means the vault root / background)
  const [cursor, setCursor] = useState<string | null>(null);
  const [dropId, setDropId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragNodeRef = useRef<string | null>(null);
  const hoverExpandRef = useRef<{ id: string; timer: number } | null>(null);

  /* structure/name changes bump namesVersion, ui.expanded is copy-on-write —
     content keystrokes (vaultVersion) never recompute the rows */
  const rows = useMemo<RowData[]>(() => {
    const out: RowData[] = [];
    const walk = (ids: string[], depth: number) => {
      for (const id of sortIds(ids)) {
        const n = store.node(id);
        if (!n) continue;
        const isOpen = n.type === "folder" && !!expanded[id];
        out.push({
          id, type: n.type, name: n.name, depth, parent: n.parent,
          expanded: isOpen, icon: n.icon, color: n.color,
        });
        if (isOpen) walk(n.children ?? [], depth + 1);
      }
    };
    walk(store.state.vault.root, 0);
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.namesVersion, expanded, state.ui.sort]);

  /* ----- mouse ----- */
  const handleClick = useCallback((id: string, type: NodeType, e: React.MouseEvent) => {
    if (store.state.renaming === id) return;
    setCursor(id);
    if (type === "folder") store.toggleExpand(id);
    else store.openFile(id, { newTab: e.ctrlKey || e.metaKey });
  }, []);

  const handleAuxClick = useCallback((id: string, type: NodeType, e: React.MouseEvent) => {
    if (type === "file" && e.button === 1) store.openFile(id, { newTab: true });
  }, []);

  const handleContextMenu = useCallback((id: string, e: React.MouseEvent) => {
    const node = store.node(id);
    if (!node) return;
    setCursor(id);
    if (node.type === "folder") folderMenu(node, e);
    else fileMenu(node, e);
  }, []);

  /* ----- drag & drop ----- */
  const clearHoverExpand = useCallback(() => {
    if (hoverExpandRef.current) {
      clearTimeout(hoverExpandRef.current.timer);
      hoverExpandRef.current = null;
    }
  }, []);

  const endDrag = useCallback(() => {
    dragNodeRef.current = null;
    setDropId(null);
    clearHoverExpand();
  }, [clearHoverExpand]);

  const handleDragStart = useCallback((id: string, e: React.DragEvent) => {
    dragNodeRef.current = id;
    setCursor(id);
    e.dataTransfer.effectAllowed = "move";
    const node = store.node(id);
    // files travel as a wikilink, so dropping one INTO the editor links it
    // (Obsidian behavior); folders use a private type so editors ignore them
    if (node?.type === "file") e.dataTransfer.setData("text/plain", `[[${node.name}]]`);
    else e.dataTransfer.setData("application/x-obsidian-node", id);
  }, []);

  const handleDragOverRow = useCallback((id: string, type: NodeType, e: React.DragEvent) => {
    e.stopPropagation(); // keep the container from claiming this as a root drop
    const dragged = dragNodeRef.current;
    if (!dragged) return; // not our drag (OS file, text selection, ...)
    if (type !== "folder" || !canDropInto(dragged, id)) {
      // invalid target: no preventDefault, so the browser shows "no drop"
      setDropId((d) => (d === null ? d : null));
      clearHoverExpand();
      return;
    }
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDropId((d) => (d === id ? d : id));
    // hovering a collapsed folder for a while opens it (Obsidian behavior)
    if (!store.state.ui.expanded[id]) {
      if (hoverExpandRef.current?.id !== id) {
        clearHoverExpand();
        const timer = window.setTimeout(() => {
          hoverExpandRef.current = null;
          if (dragNodeRef.current && !store.state.ui.expanded[id]) store.toggleExpand(id);
        }, HOVER_EXPAND_MS);
        hoverExpandRef.current = { id, timer };
      }
    } else if (hoverExpandRef.current?.id === id) {
      clearHoverExpand();
    }
  }, [clearHoverExpand]);

  const handleDragLeaveRow = useCallback((id: string, e: React.DragEvent) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setDropId((d) => (d === id ? null : d));
    if (hoverExpandRef.current?.id === id) clearHoverExpand();
  }, [clearHoverExpand]);

  const handleDropRow = useCallback((id: string, type: NodeType, e: React.DragEvent) => {
    e.stopPropagation();
    const dragged = dragNodeRef.current;
    if (dragged && type === "folder" && canDropInto(dragged, id)) {
      e.preventDefault();
      store.moveNode(dragged, id);
    }
    endDrag();
  }, [endDrag]);

  // the blank tree background is the vault root
  const handleDragOverRoot = (e: React.DragEvent) => {
    if (!dragNodeRef.current) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDropId((d) => (d === "" ? d : ""));
  };
  const handleDropRoot = (e: React.DragEvent) => {
    const dragged = dragNodeRef.current;
    if (dragged) {
      e.preventDefault();
      store.moveNode(dragged, null);
    }
    endDrag();
  };
  const handleDragLeaveRoot = (e: React.DragEvent) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setDropId(null);
    clearHoverExpand();
  };

  /* ----- keyboard ----- */
  const onKeyDown = (e: React.KeyboardEvent) => {
    if ((e.target as HTMLElement).tagName === "INPUT") return; // rename input owns its keys
    if (rows.length === 0) return;
    let idx = cursor ? rows.findIndex((r) => r.id === cursor) : -1;
    if (idx === -1 && activeFileId) idx = rows.findIndex((r) => r.id === activeFileId);
    const clampIdx = (i: number) => Math.max(0, Math.min(i, rows.length - 1));
    const current = idx >= 0 ? rows[idx] : null;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setCursor(rows[clampIdx(idx + 1)].id);
        break;
      case "ArrowUp":
        e.preventDefault();
        setCursor(rows[clampIdx(idx === -1 ? 0 : idx - 1)].id);
        break;
      case "ArrowRight": {
        if (!current) break;
        e.preventDefault();
        if (current.type === "folder") {
          if (!current.expanded) store.toggleExpand(current.id);
          else {
            const next = rows[idx + 1];
            if (next && next.parent === current.id) setCursor(next.id); // step in
          }
        }
        break;
      }
      case "ArrowLeft": {
        if (!current) break;
        e.preventDefault();
        if (current.type === "folder" && current.expanded) store.toggleExpand(current.id);
        else if (current.parent) setCursor(current.parent); // ancestors are always visible
        break;
      }
      case "Enter":
        if (!current) break;
        e.preventDefault();
        if (current.type === "folder") store.toggleExpand(current.id);
        else store.openFile(current.id);
        break;
      case "F2":
        if (!current) break;
        e.preventDefault();
        store.startRename(current.id);
        break;
      case "Delete":
        if (!current) break;
        e.preventDefault();
        store.setModal({ type: "confirmDelete", id: current.id });
        break;
    }
  };

  // keep the cursor row in view when it moves
  useEffect(() => {
    if (!cursor) return;
    containerRef.current
      ?.querySelector(`[data-id="${CSS.escape(cursor)}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [cursor]);

  useEffect(() => clearHoverExpand, [clearHoverExpand]); // no stray timers on unmount

  return (
    <div
      className={"file-tree" + (dropId === "" ? " is-drop" : "")}
      ref={containerRef}
      tabIndex={0}
      onKeyDown={onKeyDown}
      onDragOver={handleDragOverRoot}
      onDrop={handleDropRoot}
      onDragLeave={handleDragLeaveRoot}
    >
      {rows.map((r) => (
        <TreeRow
          key={r.id}
          id={r.id}
          type={r.type}
          name={r.name}
          depth={r.depth}
          expanded={r.expanded}
          icon={r.icon}
          color={r.color}
          isActive={r.type === "file" && r.id === activeFileId}
          isCursor={r.id === cursor}
          isDrop={r.id === dropId}
          renaming={state.renaming === r.id}
          onRowClick={handleClick}
          onRowAuxClick={handleAuxClick}
          onRowContextMenu={handleContextMenu}
          onRowDragStart={handleDragStart}
          onRowDragOver={handleDragOverRow}
          onRowDragLeave={handleDragLeaveRow}
          onRowDrop={handleDropRow}
          onRowDragEnd={endDrag}
        />
      ))}
    </div>
  );
}
