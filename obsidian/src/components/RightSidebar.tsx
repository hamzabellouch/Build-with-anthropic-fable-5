import { useDeferredValue, useMemo } from "react";
import { FileText, Link, List, PanelRight } from "lucide-react";
import { EditorSelection } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { store, useApp } from "../store";
import { editorApi } from "../editor/api";

interface OutlineItem {
  level: number;
  text: string;
  line: number;
}

function parseOutline(content: string): OutlineItem[] {
  const out: OutlineItem[] = [];
  let inFence = false;
  content.split("\n").forEach((raw, i) => {
    const t = raw.trimEnd();
    if (/^(```|~~~)/.test(t.trim())) {
      inFence = !inFence;
      return;
    }
    if (inFence) return;
    const m = /^(#{1,6})\s+(.+?)\s*$/.exec(t);
    if (m) out.push({ level: m[1].length, text: m[2], line: i });
  });
  return out;
}

export function RightSidebar() {
  const state = useApp();
  const tab = state.ui.tabs.find((t) => t.id === state.ui.activeTab);
  const file = tab?.fileId ? state.vault.nodes[tab.fileId] : undefined;
  const rightTab = state.ui.rightTab;

  // deferred so fast typing never blocks on heading parsing, and only
  // parsed at all while the outline tab is actually visible
  const deferredContent = useDeferredValue(file?.content ?? "");
  const outline = useMemo(
    () => (rightTab === "outline" ? parseOutline(deferredContent) : []),
    [deferredContent, rightTab]
  );

  const backlinks = useMemo(
    () => (rightTab === "backlinks" && file ? store.backlinksFor(file.id) : []),
    // vaultVersion is the change counter — state.vault keeps its identity by design
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [file?.id, rightTab, state.vaultVersion]
  );
  const mentionCount = useMemo(
    () => backlinks.reduce((sum, b) => sum + b.mentions.length, 0),
    [backlinks]
  );

  const jumpToLine = (line: number) => {
    if (tab?.mode === "live" && editorApi.view) {
      const view = editorApi.view;
      if (line + 1 <= view.state.doc.lines) {
        const pos = view.state.doc.line(line + 1).from;
        view.dispatch({
          selection: EditorSelection.cursor(pos),
          effects: EditorView.scrollIntoView(pos, { y: "start", yMargin: 24 }),
        });
        view.focus();
      }
    } else {
      document
        .querySelector(`.markdown-reading [data-line="${line}"]`)
        ?.scrollIntoView({ block: "start", behavior: "smooth" });
    }
  };

  return (
    <div className="right-split" style={{ width: `var(--right-pane-width, ${state.ui.rightWidth}px)` }}>
      <div className="right-header">
        <button
          className={"clickable-icon" + (rightTab === "backlinks" ? " is-active" : "")}
          title="Backlinks"
          onClick={() => store.setRightTab("backlinks")}
        >
          <Link />
        </button>
        <button
          className={"clickable-icon" + (rightTab === "outline" ? " is-active" : "")}
          title="Outline"
          onClick={() => store.setRightTab("outline")}
        >
          <List />
        </button>
        <span className="spacer" style={{ flex: 1 }} />
        <button className="clickable-icon" title="Collapse" onClick={() => store.toggleRight()}>
          <PanelRight />
        </button>
      </div>

      {rightTab === "outline" && (
        <>
          <div className="right-pane-title" dir="auto">
            {file ? `Outline of ${file.name}` : "Outline"}
          </div>
          <div className="pane-scroll">
            {outline.length === 0 && <div className="pane-empty">No headings in this note.</div>}
            {outline.map((h, i) => (
              <div
                key={i}
                className="outline-item"
                dir="auto"
                style={{ paddingInlineStart: 10 + (h.level - 1) * 16 }}
                onClick={() => jumpToLine(h.line)}
              >
                {h.text}
              </div>
            ))}
          </div>
        </>
      )}

      {rightTab === "backlinks" && (
        <>
          <div className="right-pane-title" dir="auto">
            {file ? `Backlinks for ${file.name} (${mentionCount})` : "Backlinks"}
          </div>
          <div className="pane-scroll">
            {(!file || backlinks.length === 0) && (
              <div className="pane-empty">No backlinks found.</div>
            )}
            {backlinks.map((b) => (
              <div key={b.file.id}>
                <div
                  className="backlink-file"
                  style={{ cursor: "pointer" }}
                  onClick={() => store.openFile(b.file.id)}
                >
                  <FileText />
                  <span className="tree-name" dir="auto">{b.file.name}</span>
                </div>
                {b.mentions.map((m, i) => (
                  <div
                    key={i}
                    className="search-match"
                    dir="auto"
                    onClick={() => store.openFile(b.file.id, { pending: { line: m.line } })}
                  >
                    {m.text}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
