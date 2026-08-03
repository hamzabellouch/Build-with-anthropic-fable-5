import { useState } from "react";
import { ChevronDown, Minus, PanelLeft, PanelRight, Plus, Square, X } from "lucide-react";
import { store, useApp } from "../store";
import { openMenu } from "./ContextMenu";

interface TabDrag {
  id: string;
  over: string | null;
  /** insert after the hovered tab (in tab-array order) */
  after: boolean;
  rtl: boolean;
}

export function TitleBar() {
  const state = useApp();
  const { tabs, activeTab } = state.ui;
  const [drag, setDrag] = useState<TabDrag | null>(null);

  const tabTitle = (fileId: string | null) =>
    fileId ? state.vault.nodes[fileId]?.name ?? "New tab" : "New tab";

  const tabListMenu = (e: React.MouseEvent) => {
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    openMenu(
      { x: r.right - 220, y: r.bottom + 4 },
      tabs.map((t) => ({
        label: tabTitle(t.fileId),
        checked: t.id === activeTab,
        action: () => store.activateTab(t.id),
      }))
    );
  };

  const tabContext = (e: React.MouseEvent, tabId: string) => {
    e.preventDefault();
    openMenu({ x: e.clientX, y: e.clientY }, [
      { label: "Close", action: () => store.closeTab(tabId) },
      {
        label: "Close others",
        action: () => {
          for (const t of [...tabs]) if (t.id !== tabId) store.closeTab(t.id);
          store.activateTab(tabId);
        },
      },
    ]);
  };

  const dropClass = (tabId: string) =>
    drag && drag.over === tabId ? (drag.after ? " drop-after" : " drop-before") : "";

  return (
    <div className="titlebar">
      {!state.ui.leftOpen && (
        <button className="clickable-icon" title="Expand" onClick={() => store.toggleLeft()} style={{ marginRight: 6 }}>
          <PanelLeft />
        </button>
      )}
      <div className="tabbar">
        {tabs.map((t, i) => {
          const isActive = t.id === activeTab;
          const nextActive = tabs[i + 1]?.id === activeTab;
          return (
            <span key={t.id} style={{ display: "contents" }}>
              <div
                className={"tab" + (isActive ? " is-active" : "") + dropClass(t.id)}
                onClick={() => store.activateTab(t.id)}
                onAuxClick={(e) => {
                  if (e.button === 1) store.closeTab(t.id);
                }}
                onContextMenu={(e) => tabContext(e, t.id)}
                title={tabTitle(t.fileId)}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.effectAllowed = "move";
                  // private type only: dropping a tab into the editor must not paste an id
                  e.dataTransfer.setData("application/x-obsidian-tab", t.id);
                  const rtl = getComputedStyle(e.currentTarget).direction === "rtl";
                  setDrag({ id: t.id, over: null, after: false, rtl });
                }}
                onDragOver={(e) => {
                  if (!drag) return;
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                  const r = e.currentTarget.getBoundingClientRect();
                  let after = e.clientX > r.left + r.width / 2; // physical half...
                  if (drag.rtl) after = !after; // ...mapped to tab-array order
                  setDrag((d) => (d && (d.over !== t.id || d.after !== after) ? { ...d, over: t.id, after } : d));
                }}
                onDragLeave={(e) => {
                  if (e.currentTarget.contains(e.relatedTarget as Node)) return;
                  setDrag((d) => (d && d.over === t.id ? { ...d, over: null } : d));
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  if (!drag) return;
                  const from = tabs.findIndex((x) => x.id === drag.id);
                  const overIdx = tabs.findIndex((x) => x.id === t.id);
                  if (from !== -1 && overIdx !== -1) {
                    let to = drag.after ? overIdx + 1 : overIdx;
                    if (from < to) to--; // index after the dragged tab is removed
                    store.moveTab(drag.id, to);
                  }
                  setDrag(null);
                }}
                onDragEnd={() => setDrag(null)}
              >
                <span className="tab-title" dir="auto">{tabTitle(t.fileId)}</span>
                <span
                  className="tab-close"
                  onClick={(e) => {
                    e.stopPropagation();
                    store.closeTab(t.id);
                  }}
                >
                  <X />
                </span>
              </div>
              {i < tabs.length - 1 ? (
                <span className={"tab-divider" + (isActive || nextActive ? " hidden" : "")} />
              ) : (
                <span className={"tab-divider" + (isActive ? " hidden" : "")} />
              )}
            </span>
          );
        })}
        <button className="clickable-icon tab-new" title="New tab" onClick={() => store.newTab()}>
          <Plus />
        </button>
      </div>
      <span className="spacer" />
      <div className="titlebar-right">
        <button className="clickable-icon" title="Open tabs" onClick={tabListMenu}>
          <ChevronDown />
        </button>
        <button className="clickable-icon" title="Expand right sidebar" onClick={() => store.toggleRight()}>
          <PanelRight />
        </button>
        <div className="win-buttons">
          <button className="win-btn" title="Minimize">
            <Minus />
          </button>
          <button
            className="win-btn"
            title="Maximize"
            onClick={() => {
              if (document.fullscreenElement) document.exitFullscreen();
              else document.documentElement.requestFullscreen?.();
            }}
          >
            <Square style={{ width: 12, height: 12 }} />
          </button>
          <button className="win-btn win-close" title="Close window" onClick={() => window.close()}>
            <X />
          </button>
        </div>
      </div>
    </div>
  );
}
