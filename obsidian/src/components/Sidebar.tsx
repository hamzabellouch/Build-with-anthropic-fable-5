import {
  ArrowUpNarrowWide, Bookmark, ChevronsDownUp, FileText, Files, FolderPlus,
  PanelLeft, Search, Settings, SquarePen, X,
} from "lucide-react";
import { store, useApp } from "../store";
import { FileTree } from "./FileTree";
import { SearchPane } from "./SearchPane";
import { openMenu } from "./ContextMenu";
import type { LeftTab } from "../types";

const VIEW_TABS: { id: LeftTab; icon: any; title: string }[] = [
  { id: "files", icon: Files, title: "Files" },
  { id: "search", icon: Search, title: "Search" },
  { id: "bookmarks", icon: Bookmark, title: "Bookmarks" },
  { id: "recents", icon: FileText, title: "Recent files" },
];

function BookmarksPane() {
  const state = useApp();
  if (state.ui.bookmarks.length === 0) {
    return (
      <div className="pane-empty">
        No bookmarks yet. Right-click a file and choose "Bookmark..." to pin it here.
      </div>
    );
  }
  return (
    <div className="pane-scroll">
      {state.ui.bookmarks.map((id) => {
        const file = state.vault.nodes[id];
        if (!file) return null;
        return (
          <div className="flat-item" key={id} onClick={() => store.openFile(id)}>
            <Bookmark />
            <span className="tree-name" dir="auto">{file.name}</span>
            <span
              className="clickable-icon item-x"
              title="Remove bookmark"
              onClick={(e) => {
                e.stopPropagation();
                store.toggleBookmark(id);
              }}
            >
              <X />
            </span>
          </div>
        );
      })}
    </div>
  );
}

function RecentsPane() {
  const state = useApp();
  const items = state.ui.recents.filter((id) => state.vault.nodes[id]);
  if (items.length === 0) return <div className="pane-empty">No recent files yet.</div>;
  return (
    <div className="pane-scroll">
      {items.map((id) => (
        <div className="flat-item" key={id} onClick={() => store.openFile(id)}>
          <FileText />
          <span className="tree-name" dir="auto">{state.vault.nodes[id].name}</span>
        </div>
      ))}
    </div>
  );
}

export function Sidebar() {
  const state = useApp();
  const { leftTab } = state.ui;

  const newNote = () => {
    const id = store.createFile(null);
    store.openFile(id);
    store.startRename(id);
  };
  const newFolder = () => {
    const id = store.createFolder(null);
    store.startRename(id);
  };
  const sortMenu = (e: React.MouseEvent) => {
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const sort = state.ui.sort;
    openMenu({ x: r.left, y: r.bottom + 4 }, [
      { label: "Custom order", checked: sort === "custom", action: () => store.setSort("custom") },
      "sep",
      { label: "File name (A to Z)", checked: sort === "az", action: () => store.setSort("az") },
      { label: "File name (Z to A)", checked: sort === "za", action: () => store.setSort("za") },
    ]);
  };

  return (
    // the var is written directly by ResizeHandle while dragging; the store
    // value (the fallback) is only committed on pointer release
    <div className="left-split" style={{ width: `var(--left-pane-width, ${state.ui.leftWidth}px)` }}>
      <div className="sidebar-header">
        {VIEW_TABS.map((t) => (
          <button
            key={t.id}
            className={"clickable-icon" + (leftTab === t.id ? " is-active" : "")}
            title={t.title}
            onClick={() => store.setLeftTab(t.id)}
          >
            <t.icon />
          </button>
        ))}
        <span className="spacer" />
        <button className="clickable-icon" title="Settings" onClick={() => store.setModal({ type: "settings" })}>
          <Settings />
        </button>
        <button className="clickable-icon" title="Collapse" onClick={() => store.toggleLeft()}>
          <PanelLeft />
        </button>
      </div>

      {leftTab === "files" && (
        <>
          <div className="nav-buttons">
            <button className="clickable-icon" title="New note" onClick={newNote}>
              <SquarePen />
            </button>
            <button className="clickable-icon" title="New folder" onClick={newFolder}>
              <FolderPlus />
            </button>
            <button className="clickable-icon" title="Change sort order" onClick={sortMenu}>
              <ArrowUpNarrowWide />
            </button>
            <button className="clickable-icon" title="Collapse all" onClick={() => store.collapseAll()}>
              <ChevronsDownUp />
            </button>
          </div>
          <div className="pane-scroll">
            <FileTree />
          </div>
        </>
      )}
      {leftTab === "search" && <SearchPane />}
      {leftTab === "bookmarks" && <BookmarksPane />}
      {leftTab === "recents" && <RecentsPane />}
    </div>
  );
}
