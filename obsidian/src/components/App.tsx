import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { store, useApp } from "../store";
import { Sidebar } from "./Sidebar";
import { TitleBar } from "./TitleBar";
import { Workspace } from "./Workspace";
import { RightSidebar } from "./RightSidebar";
import { MenuHost } from "./ContextMenu";
import { Modals } from "./Modals";
import "../features.css";

function ResizeHandle({ side }: { side: "left" | "right" }) {
  const dragging = useRef(false);
  const moved = useRef(false);
  const width = useRef(0);
  // during the drag only a CSS variable moves (no store emits / re-renders);
  // the width is committed to the store once, on pointer release
  const varName = side === "left" ? "--left-pane-width" : "--right-pane-width";
  const clamp = (w: number) =>
    side === "left" ? Math.max(200, Math.min(560, w)) : Math.max(200, Math.min(520, w));

  const finish = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    dragging.current = false;
    (e.target as HTMLElement).classList.remove("dragging");
    if (moved.current) {
      if (side === "left") store.setLeftWidth(width.current);
      else store.setRightWidth(width.current);
      // the store value now equals the variable; drop the override after React commits
      requestAnimationFrame(() => document.documentElement.style.removeProperty(varName));
    }
  };

  return (
    <div
      className="resize-handle"
      onPointerDown={(e) => {
        dragging.current = true;
        moved.current = false;
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        (e.target as HTMLElement).classList.add("dragging");
      }}
      onPointerMove={(e) => {
        if (!dragging.current) return;
        moved.current = true;
        width.current = clamp(side === "left" ? e.clientX : window.innerWidth - e.clientX);
        document.documentElement.style.setProperty(varName, `${width.current}px`);
      }}
      onPointerUp={finish}
      onPointerCancel={finish}
    />
  );
}

function Notices() {
  const state = useApp();
  if (state.notices.length === 0) return null;
  return (
    <div className="notices">
      {state.notices.map((n) => (
        <div className="notice" key={n.id} dir="auto">
          <span className="notice-msg" dir="auto">{n.msg}</span>
          {n.action && (
            <button
              className="notice-action"
              onClick={() => {
                const run = n.action!.run;
                store.dismissNotice(n.id);
                run();
              }}
            >
              {n.action.label}
            </button>
          )}
          {n.sticky && (
            <button className="notice-dismiss" title="Dismiss" onClick={() => store.dismissNotice(n.id)}>
              <X />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

export default function App() {
  const state = useApp();

  // browser tab title mirrors Obsidian's
  useEffect(() => {
    const tab = state.ui.tabs.find((t) => t.id === state.ui.activeTab);
    const file = tab?.fileId ? state.vault.nodes[tab.fileId] : undefined;
    document.title = `${file?.name ?? "New tab"} - Obsidian`;
  });

  // global hotkeys
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented) return;
      const mod = e.ctrlKey || e.metaKey;
      // also match the physical key so shortcuts keep working on Arabic layouts
      const is = (letter: string, code: string) => e.key.toLowerCase() === letter || e.code === code;

      // Ctrl+N/T/W are reserved by the browser (Ctrl+W closes the page and
      // discards the save window), so window management lives on Alt instead.
      if (e.altKey && !mod && !e.shiftKey) {
        if (is("n", "KeyN")) {
          e.preventDefault();
          const id = store.createFile(null);
          store.openFile(id);
          store.startRename(id);
        } else if (is("t", "KeyT")) {
          e.preventDefault();
          store.newTab();
        } else if (is("w", "KeyW")) {
          e.preventDefault();
          store.closeTab(store.state.ui.activeTab);
        }
        return;
      }
      if (!mod || e.altKey) return;
      if (is("o", "KeyO") && !e.shiftKey) {
        e.preventDefault();
        store.setModal({ type: "switcher" });
      } else if (is("p", "KeyP") && !e.shiftKey) {
        e.preventDefault();
        store.setModal({ type: "palette" });
      } else if (is("e", "KeyE") && !e.shiftKey) {
        e.preventDefault();
        const tab = store.activeTab;
        if (tab && tab.fileId) store.setMode(tab.id, tab.mode === "live" ? "reading" : "live");
      } else if (is("f", "KeyF") && e.shiftKey) {
        e.preventDefault();
        store.setLeftTab("search");
        setTimeout(() => {
          document.querySelector<HTMLInputElement>("[data-global-search]")?.focus();
        }, 30);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="app">
      {state.ui.leftOpen && (
        <>
          <Sidebar />
          <ResizeHandle side="left" />
        </>
      )}
      <div className="main-split">
        <TitleBar />
        <div className="workspace-row">
          <Workspace />
          {state.ui.rightOpen && (
            <>
              <ResizeHandle side="right" />
              <RightSidebar />
            </>
          )}
        </div>
      </div>
      <MenuHost />
      <Modals />
      <Notices />
    </div>
  );
}
