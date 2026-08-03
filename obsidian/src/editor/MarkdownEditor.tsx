import { useEffect, useLayoutEffect, useRef } from "react";
import { EditorState, EditorSelection, StateEffect } from "@codemirror/state";
import { EditorView, keymap, drawSelection, dropCursor } from "@codemirror/view";
import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import { searchKeymap } from "@codemirror/search";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { languages } from "@codemirror/language-data";
import { syntaxHighlighting, HighlightStyle, indentUnit } from "@codemirror/language";
import { tags } from "@lezer/highlight";
import { livePreview, lpRefresh } from "./livePreview";
import { wikilinkAutocomplete } from "./wikilinkComplete";
import { attachLinkHoverPreview } from "./hoverPreview";
import { editorApi } from "./api";
import { store, normalize } from "../store";
import type { PendingNav } from "../types";
import "./editor-extras.css";

const codeHighlight = HighlightStyle.define([
  { tag: tags.keyword, color: "#cf8ee0" },
  { tag: tags.string, color: "#98c379" },
  { tag: [tags.comment, tags.lineComment, tags.blockComment], color: "#6a737d", fontStyle: "italic" },
  { tag: tags.number, color: "#d19a66" },
  { tag: [tags.function(tags.variableName), tags.function(tags.propertyName)], color: "#61afef" },
  { tag: tags.typeName, color: "#e5c07b" },
  { tag: tags.bool, color: "#d19a66" },
  { tag: tags.operator, color: "#56b6c2" },
  { tag: tags.className, color: "#e5c07b" },
]);

/* ---------- editor state cache ----------
 * Keyed by tabId:fileId. Booting from a cached state preserves undo
 * history, cursor and scroll across tab switches and reading-mode
 * toggles. Entries are invalidated when the store content diverges. */
interface EditorCacheEntry {
  state: EditorState;
  /** view.scrollSnapshot() effect — restores scroll anchored to a doc
      position, immune to CM's async height measurement on mount */
  scroll: StateEffect<unknown>;
}
const stateCache = new Map<string, EditorCacheEntry>();
const STATE_CACHE_MAX = 20;
function cacheEditorState(key: string, entry: EditorCacheEntry) {
  stateCache.delete(key);
  stateCache.set(key, entry);
  if (stateCache.size > STATE_CACHE_MAX) {
    const oldest = stateCache.keys().next().value;
    if (oldest !== undefined) stateCache.delete(oldest);
  }
}

const SAVE_DEBOUNCE_MS = 150;

interface Props {
  fileId: string;
  content: string;
  namesVersion: number;
  onChange: (text: string) => void;
}

export function MarkdownEditor({ fileId, content, namesVersion, onChange }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  // save path: the last text we pushed to the store, plus the debounced send
  const lastSentRef = useRef(content);
  const pendingTextRef = useRef<string | null>(null);
  const saveTimerRef = useRef<number | undefined>(undefined);

  // useLayoutEffect, not useEffect: on keyed unmounts React runs passive
  // cleanups only after the DOM is detached, where scrollSnapshot() would
  // read scrollTop 0 — layout cleanups run while the editor is still laid out
  useLayoutEffect(() => {
    // the editor only ever mounts inside the active tab
    const cacheKey = store.state.ui.activeTab + ":" + fileId;
    const spell = (store.state.ui as any).settings?.spellcheck ?? false;

    const flushSave = () => {
      if (saveTimerRef.current !== undefined) {
        clearTimeout(saveTimerRef.current);
        saveTimerRef.current = undefined;
      }
      const text = pendingTextRef.current;
      if (text !== null) {
        pendingTextRef.current = null;
        lastSentRef.current = text; // before onChange, so the echo is a no-op
        onChangeRef.current(text);
      }
    };

    const extensions = [
      history(),
      drawSelection(),
      dropCursor(),
      EditorState.allowMultipleSelections.of(true),
      indentUnit.of("    "),
      EditorView.lineWrapping,
      markdown({ base: markdownLanguage, codeLanguages: languages }),
      syntaxHighlighting(codeHighlight),
      livePreview({
        openInternal: (target, opts) => store.openWikilink(target, fileId, { newTab: opts?.newTab }),
        // note text is untrusted: never window.open javascript:/data: schemes
        openExternal: (url) => {
          if (/^(https?:|mailto:)/i.test(url)) window.open(url, "_blank", "noopener");
        },
        isResolved: (target) => !!store.resolveByName(target),
      }),
      wikilinkAutocomplete(), // before the main keymap: completion gets Enter/Escape first
      keymap.of([...defaultKeymap, ...historyKeymap, ...searchKeymap, indentWithTab]),
      EditorView.updateListener.of((u) => {
        if (!u.docChanged) return;
        const text = u.state.doc.toString(); // computed once per change
        if (saveTimerRef.current !== undefined) {
          clearTimeout(saveTimerRef.current);
          saveTimerRef.current = undefined;
        }
        if (text === lastSentRef.current) {
          // back in sync (undo of unsent typing, or an external-sync echo)
          pendingTextRef.current = null;
          return;
        }
        pendingTextRef.current = text;
        saveTimerRef.current = window.setTimeout(flushSave, SAVE_DEBOUNCE_MS);
      }),
      EditorView.contentAttributes.of({
        spellcheck: spell ? "true" : "false",
        autocorrect: "off",
        autocapitalize: "off",
      }),
    ];

    const cached = stateCache.get(cacheKey);
    const reuse = !!cached && cached.state.doc.toString() === content;
    if (cached && !reuse) stateCache.delete(cacheKey); // diverged while unmounted
    let view: EditorView;
    if (reuse && cached) {
      view = new EditorView({ state: cached.state, parent: hostRef.current! });
      // swap in this mount's fresh closures; doc, selection and undo
      // history (module-level history field) survive the reconfigure
      view.dispatch({ effects: StateEffect.reconfigure.of(extensions) });
    } else {
      view = new EditorView({
        state: EditorState.create({ doc: content, extensions }),
        parent: hostRef.current!,
      });
    }
    viewRef.current = view;
    editorApi.view = view;
    lastSentRef.current = content;

    const detachHover = attachLinkHoverPreview(view.dom, {
      getTarget: (el) => el.getAttribute("data-target"),
      resolve: (target) => {
        const f = store.resolveByName(target);
        return f ? { name: f.name, content: f.content ?? "" } : null;
      },
      openTarget: (target) => store.openWikilink(target, fileId),
    });

    // pending navigation (search result, backlink, heading anchor...);
    // offsets may be stale relative to the live doc, so clamp + guard
    const applyPending = (pending: PendingNav) => {
      const doc = view.state.doc;
      let anchor: number | undefined;
      let head: number | undefined;
      if (pending.selFrom != null) {
        anchor = Math.max(0, Math.min(pending.selFrom, doc.length));
        head = Math.max(0, Math.min(pending.selTo ?? pending.selFrom, doc.length));
      } else if (pending.line != null) {
        const lineNo = Math.max(1, Math.min(pending.line + 1, doc.lines));
        anchor = head = doc.line(lineNo).from;
      } else if (pending.heading) {
        const want = normalize(pending.heading);
        for (let i = 1; i <= doc.lines; i++) {
          const m = /^#{1,6}\s+(.+?)\s*$/.exec(doc.line(i).text);
          if (m && normalize(m[1]) === want) {
            anchor = head = doc.line(i).from;
            break;
          }
        }
      }
      if (anchor == null) return;
      try {
        view.dispatch({
          selection: EditorSelection.range(anchor, head ?? anchor),
          effects: EditorView.scrollIntoView(anchor, { y: "center" }),
        });
        view.focus();
      } catch {
        /* stale navigation target must never crash the editor */
      }
    };

    const pendingAtMount = store.consumePending(fileId);
    if (reuse && cached && !pendingAtMount) {
      try {
        view.dispatch({ effects: cached.scroll });
      } catch {
        /* snapshot from a stale state shape — skip scroll restore */
      }
    }
    if (pendingAtMount) applyPending(pendingAtMount);

    // consume pending navs that arrive while this file is already open
    // (e.g. clicking a search result or backlink for the current note)
    const unsubscribe = store.subscribe(() => {
      if (store.pending?.fileId !== fileId) return;
      const p = store.consumePending(fileId);
      if (p) applyPending(p);
    });

    // page close/hide within the editor's debounce window must not lose
    // keystrokes: push pending text into the store, then force the store's
    // own synchronous write (its hide listener may have already fired with
    // stale content — a second rev-stamped write is harmless)
    const flushThrough = () => {
      flushSave();
      store.flushSave();
    };
    const onVisibilityHide = () => {
      if (document.visibilityState === "hidden") flushThrough();
    };
    window.addEventListener("pagehide", flushThrough);
    document.addEventListener("visibilitychange", onVisibilityHide);

    return () => {
      unsubscribe();
      detachHover();
      window.removeEventListener("pagehide", flushThrough);
      document.removeEventListener("visibilitychange", onVisibilityHide);
      flushSave(); // mode toggles / tab switches must never lose keystrokes
      cacheEditorState(cacheKey, { state: view.state, scroll: view.scrollSnapshot() });
      if (editorApi.view === view) editorApi.view = null;
      viewRef.current = null;
      view.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileId]);

  // external content changes (e.g. checkbox toggled in reading mode)
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    // skip our own echoes, and never clobber in-flight (debounced) typing
    if (content === lastSentRef.current || pendingTextRef.current !== null) return;
    const current = view.state.doc.toString();
    lastSentRef.current = content; // before dispatch: the listener sees the echo
    if (content !== current) {
      view.dispatch({ changes: { from: 0, to: current.length, insert: content } });
    }
  }, [content]);

  // re-resolve wikilinks when files are created/renamed/deleted
  useEffect(() => {
    viewRef.current?.dispatch({ annotations: lpRefresh.of(true) });
  }, [namesVersion]);

  return <div className="editor-host" ref={hostRef} />;
}
