import {
  Decoration, DecorationSet, EditorView, ViewPlugin, ViewUpdate, WidgetType,
} from "@codemirror/view";
import { Annotation, Range, Line, Extension } from "@codemirror/state";
import { syntaxTree } from "@codemirror/language";
import type { SyntaxNode } from "@lezer/common";

export interface LivePreviewConfig {
  openInternal: (target: string, opts?: { newTab?: boolean }) => void;
  openExternal: (url: string) => void;
  isResolved: (target: string) => boolean;
}

/** Dispatch with this annotation to force decoration rebuild (e.g. vault renames). */
export const lpRefresh = Annotation.define<boolean>();

/* ---------------- widgets ---------------- */

class BulletWidget extends WidgetType {
  eq() { return true; }
  toDOM() {
    const s = document.createElement("span");
    s.className = "cm-list-bullet";
    s.textContent = "•";
    return s;
  }
  ignoreEvent() { return false; }
}

class CheckboxWidget extends WidgetType {
  constructor(readonly checked: boolean, readonly pos: number) { super(); }
  eq(o: CheckboxWidget) { return o.checked === this.checked && o.pos === this.pos; }
  toDOM(view: EditorView) {
    const wrap = document.createElement("span");
    wrap.className = "cm-task-widget";
    const box = document.createElement("input");
    box.type = "checkbox";
    box.checked = this.checked;
    box.addEventListener("mousedown", (e) => {
      e.preventDefault();
      e.stopPropagation();
      view.dispatch({
        changes: { from: this.pos + 1, to: this.pos + 2, insert: this.checked ? " " : "x" },
      });
    });
    wrap.appendChild(box);
    return wrap;
  }
  ignoreEvent() { return true; }
}

class HRWidget extends WidgetType {
  eq() { return true; }
  toDOM() {
    const el = document.createElement("span");
    el.className = "cm-hr-widget";
    el.appendChild(document.createElement("hr"));
    return el;
  }
  ignoreEvent() { return false; }
}

/* ---------------- decoration builder ---------------- */

const INLINE_CLASSES: Record<string, { cls: string; markName: string }> = {
  StrongEmphasis: { cls: "cm-strong", markName: "EmphasisMark" },
  Emphasis: { cls: "cm-em", markName: "EmphasisMark" },
  Strikethrough: { cls: "cm-strikethrough", markName: "StrikethroughMark" },
};

const WIKILINK_RE = /\[\[([^\[\]\n]+?)\]\]/g;

function buildDecorations(view: EditorView, cfg: LivePreviewConfig): DecorationSet {
  const { state } = view;
  const doc = state.doc;
  const tree = syntaxTree(state);
  const ranges: Range<Decoration>[] = [];

  // line metadata accumulated, emitted at the end
  const lineClasses = new Map<number, Set<string>>();
  const lineDirs = new Map<number, "ltr">();
  const replacedLines = new Set<number>(); // fully-replaced lines (hr) -> skip dir attr conflicts? keep dir anyway
  const codeBlocks: { from: number; to: number }[] = [];

  // like Obsidian: only reveal syntax around the cursor while the editor is focused
  const focused = view.hasFocus;
  const touches = (from: number, to: number) =>
    focused && state.selection.ranges.some((r) => r.to >= from && r.from <= to);
  const lineTouched = (line: Line) => touches(line.from, line.to);

  const hide = (from: number, to: number) => {
    if (to > from) ranges.push(Decoration.replace({}).range(from, to));
  };
  const mark = (from: number, to: number, cls: string, attrs?: Record<string, string>) => {
    if (to > from)
      ranges.push(Decoration.mark({ class: cls, attributes: attrs }).range(from, to));
  };
  const addLineClass = (line: Line, cls: string) => {
    let set = lineClasses.get(line.from);
    if (!set) lineClasses.set(line.from, (set = new Set()));
    set.add(cls);
  };
  const eachLine = (from: number, to: number, fn: (line: Line) => void) => {
    let pos = from;
    while (pos <= to) {
      const line = doc.lineAt(pos);
      fn(line);
      pos = line.to + 1;
    }
  };

  for (const vr of view.visibleRanges) {
    tree.iterate({
      from: vr.from,
      to: vr.to,
      enter: (n): boolean | void => {
        const name = n.name;

        /* ----- headings ----- */
        const h = /^ATXHeading([1-6])$/.exec(name);
        if (h) {
          const line = doc.lineAt(n.from);
          addLineClass(line, "cm-line-heading");
          addLineClass(line, `cm-line-h${h[1]}`);
          const markNode = n.node.getChild("HeaderMark");
          if (markNode) {
            if (!lineTouched(line)) {
              let end = markNode.to;
              if (doc.sliceString(end, end + 1) === " ") end++;
              hide(markNode.from, end);
            } else {
              mark(markNode.from, markNode.to, "cm-formatting");
            }
          }
          return;
        }
        if (name === "SetextHeading1" || name === "SetextHeading2") {
          const line = doc.lineAt(n.from);
          addLineClass(line, "cm-line-heading");
          addLineClass(line, name === "SetextHeading1" ? "cm-line-h1" : "cm-line-h2");
          return;
        }

        /* ----- inline emphasis-style nodes ----- */
        if (INLINE_CLASSES[name]) {
          const { cls, markName } = INLINE_CLASSES[name];
          mark(n.from, n.to, cls);
          const reveal = touches(n.from, n.to);
          for (const m of n.node.getChildren(markName)) {
            if (reveal) mark(m.from, m.to, "cm-formatting");
            else hide(m.from, m.to);
          }
          return;
        }

        if (name === "InlineCode") {
          mark(n.from, n.to, "cm-inline-code");
          const reveal = touches(n.from, n.to);
          for (const m of n.node.getChildren("CodeMark")) {
            if (reveal) mark(m.from, m.to, "cm-formatting");
            else hide(m.from, m.to);
          }
          return;
        }

        /* ----- links ----- */
        if (name === "Link" || name === "Image") {
          const node: SyntaxNode = n.node;
          const marks = node.getChildren("LinkMark");
          const urlNode = node.getChild("URL");
          const url = urlNode ? doc.sliceString(urlNode.from, urlNode.to) : "";
          const reveal = touches(n.from, n.to);
          if (marks.length >= 2) {
            const textFrom = marks[0].to;
            const textTo = marks[1].from;
            mark(
              textFrom,
              textTo,
              "cm-link" + (reveal ? " cm-link-revealed" : ""),
              url ? { "data-href": url } : undefined
            );
            if (!reveal) {
              hide(n.from, textFrom);
              hide(textTo, n.to);
            } else {
              mark(n.from, textFrom, "cm-formatting");
              mark(textTo, n.to, "cm-formatting cm-link-url");
            }
          } else if (url) {
            mark(n.from, n.to, "cm-link" + (reveal ? " cm-link-revealed" : ""), { "data-href": url });
          }
          return false;
        }

        if (name === "Autolink") {
          const text = doc.sliceString(n.from, n.to);
          const url = text.replace(/^<|>$/g, "");
          const reveal = touches(n.from, n.to);
          mark(n.from, n.to, "cm-link" + (reveal ? " cm-link-revealed" : ""), { "data-href": url });
          if (!reveal) {
            if (text.startsWith("<")) hide(n.from, n.from + 1);
            if (text.endsWith(">")) hide(n.to - 1, n.to);
          }
          return false;
        }

        if (name === "URL") {
          const parent = n.node.parent?.name;
          if (parent !== "Link" && parent !== "Image" && parent !== "Autolink") {
            const url = doc.sliceString(n.from, n.to);
            const reveal = touches(n.from, n.to);
            mark(n.from, n.to, "cm-link" + (reveal ? " cm-link-revealed" : ""), { "data-href": url });
          }
          return;
        }

        /* ----- lists ----- */
        if (name === "ListMark") {
          const line = doc.lineAt(n.from);
          const markText = doc.sliceString(n.from, n.to);
          if (/^\d/.test(markText)) return; // ordered list: keep numbers
          const after = doc.sliceString(n.to, Math.min(line.to, n.to + 5));
          const isTask = /^ \[[ xX]\]/.test(after);
          if (!lineTouched(line)) {
            if (isTask) hide(n.from, n.to + 1);
            else ranges.push(Decoration.replace({ widget: new BulletWidget() }).range(n.from, n.to));
          } else {
            mark(n.from, n.to, "cm-formatting");
          }
          return;
        }

        if (name === "TaskMarker") {
          const line = doc.lineAt(n.from);
          if (!lineTouched(line)) {
            const checked = /[xX]/.test(doc.sliceString(n.from + 1, n.to - 1));
            ranges.push(
              Decoration.replace({ widget: new CheckboxWidget(checked, n.from) }).range(n.from, n.to)
            );
            if (checked && n.to + 1 < line.to) mark(n.to + 1, line.to, "cm-task-done");
          } else {
            mark(n.from, n.to, "cm-formatting");
          }
          return;
        }

        /* ----- blockquote ----- */
        if (name === "Blockquote") {
          eachLine(n.from, n.to, (line) => addLineClass(line, "cm-blockquote"));
          return;
        }
        if (name === "QuoteMark") {
          const line = doc.lineAt(n.from);
          if (!lineTouched(line)) {
            let end = n.to;
            if (doc.sliceString(end, end + 1) === " ") end++;
            hide(n.from, end);
          } else {
            mark(n.from, n.to, "cm-formatting");
          }
          return;
        }

        /* ----- code blocks ----- */
        if (name === "FencedCode" || name === "CodeBlock") {
          codeBlocks.push({ from: n.from, to: n.to });
          const first = doc.lineAt(n.from);
          const last = doc.lineAt(n.to);
          eachLine(n.from, n.to, (line) => {
            addLineClass(line, "cm-codeblock");
            lineDirs.set(line.from, "ltr");
            if (line.from === first.from) addLineClass(line, "cm-codeblock-begin");
            if (line.from === last.from) addLineClass(line, "cm-codeblock-end");
          });
          if (name === "FencedCode" && !touches(n.from, n.to)) {
            // hide the fence lines' content (leaves padded edges, like Obsidian)
            if (/^(`{3,}|~{3,})/.test(first.text)) hide(first.from, first.to);
            if (last.from !== first.from && /^\s*(`{3,}|~{3,})\s*$/.test(last.text)) hide(last.from, last.to);
          }
          return false;
        }

        if (name === "Table") {
          codeBlocks.push({ from: n.from, to: n.to });
          eachLine(n.from, n.to, (line) => {
            addLineClass(line, "cm-table");
            lineDirs.set(line.from, "ltr");
          });
          return false;
        }

        /* ----- horizontal rule ----- */
        if (name === "HorizontalRule") {
          const line = doc.lineAt(n.from);
          if (!lineTouched(line)) {
            ranges.push(Decoration.replace({ widget: new HRWidget() }).range(line.from, line.to));
            replacedLines.add(line.from);
          } else {
            mark(line.from, line.to, "cm-formatting");
          }
          return;
        }
      },
    });

    /* ----- wikilinks + per-line direction ----- */
    eachLine(vr.from, vr.to, (line) => {
      // direction attribute for every line (auto unless forced ltr by code/table)
      if (!lineDirs.has(line.from)) {
        // dir=auto resolves alignment+bidi per line from first strong char
        ranges.push(Decoration.line({ attributes: { dir: "auto" } }).range(line.from));
      } else {
        ranges.push(Decoration.line({ attributes: { dir: "ltr" } }).range(line.from));
      }

      if (codeBlocks.some((c) => line.from < c.to && line.to > c.from)) return;
      if (replacedLines.has(line.from)) return;

      WIKILINK_RE.lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = WIKILINK_RE.exec(line.text))) {
        const start = line.from + m.index;
        const end = start + m[0].length;
        // skip wikilinks inside inline code
        let inCode = false;
        let cur: SyntaxNode | null = tree.resolveInner(start + 1, 1);
        while (cur) {
          if (cur.name === "InlineCode" || cur.name === "CodeText") { inCode = true; break; }
          cur = cur.parent;
        }
        if (inCode) continue;

        const inner = m[1];
        const pipeIdx = inner.indexOf("|");
        const target = (pipeIdx === -1 ? inner : inner.slice(0, pipeIdx)).trim();
        const resolved = cfg.isResolved(target);
        const cls = "cm-link cm-internal" + (resolved ? "" : " cm-unresolved");
        const attrs = { "data-target": target };

        if (!touches(start, end)) {
          hide(start, start + 2);
          let displayFrom = start + 2;
          if (pipeIdx !== -1) {
            hide(start + 2, start + 2 + pipeIdx + 1);
            displayFrom = start + 2 + pipeIdx + 1;
          }
          mark(displayFrom, end - 2, cls, attrs);
          hide(end - 2, end);
        } else {
          mark(start, end, cls + " cm-link-revealed", attrs);
        }
      }
    });
  }

  /* ----- emit accumulated line classes ----- */
  for (const [from, classes] of lineClasses) {
    ranges.push(Decoration.line({ class: [...classes].join(" ") }).range(from));
  }

  return Decoration.set(ranges, true);
}

/* ---------------- plugin ---------------- */

export function livePreview(cfg: LivePreviewConfig): Extension {
  const plugin = ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;
      constructor(view: EditorView) {
        this.decorations = buildDecorations(view, cfg);
      }
      update(update: ViewUpdate) {
        if (
          update.docChanged ||
          update.selectionSet ||
          update.viewportChanged ||
          update.focusChanged ||
          update.transactions.some((tr) => tr.annotation(lpRefresh))
        ) {
          this.decorations = buildDecorations(update.view, cfg);
        }
      }
    },
    {
      decorations: (v) => v.decorations,
      eventHandlers: {
        // Obsidian parity: plain click follows a rendered (non-revealed) link,
        // Ctrl/Cmd+click always follows (internal links open in a new tab),
        // and clicks on revealed (raw syntax) links just place the cursor.
        mousedown(e) {
          if (e.button !== 0) return false;
          const el = (e.target as HTMLElement).closest?.(".cm-link");
          if (!el) return false;
          const target = el.getAttribute("data-target");
          const href = el.getAttribute("data-href");
          if (!target && !href) return false;
          const mod = e.ctrlKey || e.metaKey;
          if (!mod && el.classList.contains("cm-link-revealed")) return false;
          if (target) cfg.openInternal(target, { newTab: mod });
          else if (href) cfg.openExternal(href);
          e.preventDefault();
          return true;
        },
      },
    }
  );
  return [plugin, EditorView.perLineTextDirection.of(true)];
}
