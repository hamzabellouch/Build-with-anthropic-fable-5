import {
  autocompletion, closeBrackets, closeBracketsKeymap, completionKeymap,
  insertCompletionText, pickedCompletion,
  CompletionContext, Completion, CompletionResult,
} from "@codemirror/autocomplete";
import { keymap, EditorView } from "@codemirror/view";
import { Prec } from "@codemirror/state";
import type { Extension } from "@codemirror/state";
import { store } from "../store";
import { fuzzyScore } from "../fuzzy";

const MAX_OPTIONS = 12;

/** `[[` plus anything that is not a bracket, ending at the cursor. */
const LINK_PREFIX_RE = /\[\[[^\[\]]*$/;

/**
 * Inserts `<text>]]` for the completed range. If a `]]` (or a lone `]`)
 * already sits right after the cursor — e.g. closeBrackets produced
 * `[[]]` — it is consumed instead of duplicated.
 */
const applyLinkText = (text: string) =>
  (view: EditorView, completion: Completion, from: number, to: number) => {
    let end = to;
    const ahead = view.state.sliceDoc(to, to + 2);
    if (ahead === "]]") end = to + 2;
    else if (ahead.startsWith("]")) end = to + 1;
    view.dispatch({
      ...insertCompletionText(view.state, text + "]]", from, end),
      annotations: pickedCompletion.of(completion),
    });
  };

/** Headings (`# ...` .. `###### ...`) outside fenced code blocks. */
function parseHeadings(content: string): { text: string; level: number }[] {
  const out: { text: string; level: number }[] = [];
  let fence: string | null = null;
  for (const line of content.split("\n")) {
    const f = /^\s*(`{3,}|~{3,})/.exec(line);
    if (f) {
      if (!fence) fence = f[1][0];
      else if (f[1][0] === fence) fence = null;
      continue;
    }
    if (fence) continue;
    const m = /^(#{1,6})\s+(.+?)\s*$/.exec(line);
    if (m) out.push({ text: m[2], level: m[1].length });
  }
  return out;
}

/** Completion source for `[[Note]]` and `[[Note#Heading]]` wikilinks. */
export function wikilinkSource(context: CompletionContext): CompletionResult | null {
  const match = context.matchBefore(LINK_PREFIX_RE);
  if (!match) return null;
  const inner = match.text.slice(2);
  if (inner.includes("|")) return null; // typing an alias: nothing to suggest

  /* ----- heading completions after a complete "[[Name#" prefix ----- */
  const hashIdx = inner.indexOf("#");
  if (hashIdx !== -1) {
    const noteName = inner.slice(0, hashIdx);
    const query = inner.slice(hashIdx + 1);
    const file = noteName ? store.resolveByName(noteName) : undefined;
    if (!file) return null;
    let headings = parseHeadings(file.content ?? "");
    if (query) {
      headings = headings
        .map((h) => ({ h, score: fuzzyScore(query, h.text) }))
        .filter((x) => x.score >= 0)
        .sort((a, b) => b.score - a.score)
        .map((x) => x.h);
    }
    if (!headings.length) return null;
    const options: Completion[] = headings.slice(0, MAX_OPTIONS).map((h) => ({
      label: h.text,
      detail: "H" + h.level,
      apply: applyLinkText(noteName + "#" + h.text),
    }));
    return { from: match.from + 2, options, filter: false };
  }

  /* ----- note name completions ----- */
  const query = inner;
  const ranked = store
    .allFiles()
    .map((f) => ({
      f,
      score: query
        ? Math.max(fuzzyScore(query, f.name), fuzzyScore(query, store.pathString(f.id)) - 1)
        : 0,
    }))
    .filter((x) => x.score >= 0)
    .sort((a, b) => b.score - a.score || a.f.name.localeCompare(b.f.name));
  if (!ranked.length) return null;
  const options: Completion[] = ranked.slice(0, MAX_OPTIONS).map(({ f }) => ({
    label: f.name,
    detail: store.pathOf(f.id).slice(0, -1).map((n) => n.name).join("/") || undefined,
    apply: applyLinkText(f.name),
  }));
  return { from: match.from + 2, options, filter: false };
}

/**
 * Wikilink autocomplete + bracket auto-closing. The completion keymap must
 * outrank lang-markdown's Prec.high Enter binding (list continuation), so it
 * is registered at Prec.highest — the bindings fall through when no
 * completion is open.
 */
export function wikilinkAutocomplete(): Extension {
  return [
    autocompletion({
      override: [wikilinkSource],
      icons: false,
      defaultKeymap: false,
      activateOnTypingDelay: 30,
    }),
    closeBrackets(),
    Prec.highest(keymap.of(completionKeymap)),
    keymap.of(closeBracketsKeymap),
  ];
}
