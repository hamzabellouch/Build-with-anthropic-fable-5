import type { EditorView } from "@codemirror/view";

/** The currently-mounted editor view (one editor visible at a time). */
export const editorApi: { view: EditorView | null } = { view: null };
