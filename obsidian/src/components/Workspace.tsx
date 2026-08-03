import { useMemo } from "react";
import {
  ArrowLeft, ArrowRight, Bookmark, BookOpen, EllipsisVertical, ExternalLink,
  FileDown, FileJson, FileUp, PencilLine, Trash2,
} from "lucide-react";
import { store, useApp } from "../store";
import { MarkdownEditor } from "../editor/MarkdownEditor";
import { ReadingView } from "./ReadingView";
import { openMenu } from "./ContextMenu";
import type { MenuEntry } from "./ContextMenu";
import { ErrorBoundary } from "./ErrorBoundary";
import { SyncPill } from "./SyncPill";
import { exportJSON, exportZip, pickImportFile } from "./actions";

// charCodeAt-level \s test (the word counter must not allocate per keystroke)
function isSpaceCode(c: number): boolean {
  return (
    c === 32 || (c >= 9 && c <= 13) || c === 160 || c === 0x1680 ||
    (c >= 0x2000 && c <= 0x200a) || c === 0x2028 || c === 0x2029 ||
    c === 0x202f || c === 0x205f || c === 0x3000 || c === 0xfeff
  );
}

function EmptyTab() {
  return (
    <div className="empty-state">
      <div className="empty-title">No file is open</div>
      <div
        className="empty-action"
        onClick={() => {
          const id = store.createFile(null);
          store.openFile(id);
          store.startRename(id);
        }}
      >
        Create new note (Alt + N)
      </div>
      <div className="empty-action" onClick={() => store.setModal({ type: "switcher" })}>
        Go to file (Ctrl + O)
      </div>
      <div className="empty-action" onClick={() => store.closeTab(store.state.ui.activeTab)}>
        Close tab (Alt + W)
      </div>
    </div>
  );
}

export function Workspace() {
  const state = useApp();
  const tab = state.ui.tabs.find((t) => t.id === state.ui.activeTab);
  const file = tab?.fileId ? state.vault.nodes[tab.fileId] : undefined;
  const crumbs = file ? store.pathOf(file.id) : [];

  const counts = useMemo(() => {
    const content = file?.content ?? "";
    let words = 0;
    let inWord = false;
    for (let i = 0; i < content.length; i++) {
      const space = isSpaceCode(content.charCodeAt(i));
      if (!space && !inWord) words++;
      inWord = !space;
    }
    return { words, chars: content.length };
  }, [file?.content]);

  if (!tab) return null;

  const toggleMode = () => store.setMode(tab.id, tab.mode === "live" ? "reading" : "live");

  const moreMenu = (e: React.MouseEvent) => {
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const items: MenuEntry[] = [];
    if (file) {
      const bookmarked = state.ui.bookmarks.includes(file.id);
      items.push(
        {
          label: tab.mode === "live" ? "Reading view" : "Editing view",
          icon: tab.mode === "live" ? <BookOpen /> : <PencilLine />,
          action: toggleMode,
        },
        { label: "Open in new tab", icon: <ExternalLink />, action: () => store.openFile(file.id, { newTab: true }) },
        "sep",
        {
          label: bookmarked ? "Remove bookmark" : "Bookmark...",
          icon: <Bookmark />,
          action: () => store.toggleBookmark(file.id),
        },
        {
          label: "Rename...",
          icon: <PencilLine />,
          action: () => {
            store.setLeftTab("files");
            store.startRename(file.id);
          },
        },
        "sep",
        {
          label: "Delete file",
          icon: <Trash2 />,
          danger: true,
          action: () => store.setModal({ type: "confirmDelete", id: file.id }),
        },
        "sep"
      );
    }
    items.push(
      { label: "Export vault (Markdown .zip)", icon: <FileDown />, action: exportZip },
      { label: "Download JSON backup", icon: <FileJson />, action: exportJSON },
      { label: "Import JSON backup...", icon: <FileUp />, action: pickImportFile }
    );
    openMenu({ x: r.right - 230, y: r.bottom + 6 }, items);
  };

  return (
    <section className="workspace">
      <header className="view-header">
        <div className="view-nav">
          <button
            className={"clickable-icon" + (store.canBack() ? "" : " disabled")}
            title="Navigate back"
            onClick={() => store.back()}
          >
            <ArrowLeft />
          </button>
          <button
            className={"clickable-icon" + (store.canForward() ? "" : " disabled")}
            title="Navigate forward"
            onClick={() => store.forward()}
          >
            <ArrowRight />
          </button>
        </div>
        <div className="view-title">
          {crumbs.map((c, i) => (
            <span key={c.id} style={{ display: "contents" }}>
              {i > 0 && <span className="crumb-sep">/</span>}
              <span
                className="crumb"
                dir="auto"
                onClick={() => {
                  if (c.type === "folder") {
                    store.setLeftTab("files");
                    if (!store.state.ui.expanded[c.id]) store.toggleExpand(c.id);
                  }
                }}
              >
                {c.name}
              </span>
            </span>
          ))}
        </div>
        <div className="view-actions">
          {file && (
            <button
              className="clickable-icon"
              title={tab.mode === "live" ? "Current view: editing\nClick to read" : "Current view: reading\nClick to edit"}
              onClick={toggleMode}
            >
              {tab.mode === "live" ? <BookOpen /> : <PencilLine />}
            </button>
          )}
          <button className="clickable-icon" title="More options" onClick={moreMenu}>
            <EllipsisVertical />
          </button>
        </div>
      </header>

      <div className="view-content">
        {/* a crash inside the editor/reader leaves tabs + sidebars alive;
            keyed so navigating to another note recovers without a reload */}
        <ErrorBoundary compact key={tab.id + ":" + (file?.id ?? "empty")}>
          {!file ? (
            <EmptyTab />
          ) : tab.mode === "live" ? (
            <MarkdownEditor
              /* spellcheck is read at view creation — the key remount applies it
                 live; doc/undo/scroll survive via the editor state cache */
              key={tab.id + ":" + file.id + ":" + (state.ui.settings.spellcheck ? "s1" : "s0")}
              fileId={file.id}
              content={file.content ?? ""}
              namesVersion={state.namesVersion}
              onChange={(text) => store.updateContent(file.id, text)}
            />
          ) : (
            <ReadingView
              key={tab.id + ":" + file.id + ":r"}
              fileId={file.id}
              content={file.content ?? ""}
              namesVersion={state.namesVersion}
            />
          )}
        </ErrorBoundary>
      </div>

      <div className="status-bar">
        <SyncPill />
        {file && (
          <>
            <span>{counts.words} words</span>
            <span>{counts.chars} characters</span>
          </>
        )}
      </div>
    </section>
  );
}
