import { store } from "../store";
import { editorApi } from "../editor/api";
import { exportVaultJSON, exportVaultZip } from "../export";

/** Return focus to the editor (after a modal closes, a file opens from the
    switcher/palette/search, ...). Retries across a few frames because the
    editor may be remounting; gives up silently when another modal took over
    in the meantime or no editor view exists (empty / reading tab). */
export function focusEditorSoon() {
  let tries = 5;
  const attempt = () => {
    if (store.state.modal) return; // a newly-opened modal owns focus now
    const view = editorApi.view;
    if (view) view.focus();
    else if (--tries > 0) requestAnimationFrame(attempt);
  };
  requestAnimationFrame(attempt);
}

export function exportZip() {
  exportVaultZip(store).catch(() => store.notice("Export failed.", { sticky: true }));
}

export function exportJSON() {
  try {
    exportVaultJSON(store);
  } catch {
    store.notice("Export failed.", { sticky: true });
  }
}

/** Pick a .json backup via a hidden file input, then hand off to the
    confirm-import dialog (importing replaces the whole vault). */
export function pickImportFile() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".json,application/json";
  input.style.display = "none";
  input.addEventListener("change", () => {
    const file = input.files?.[0];
    input.remove();
    if (file) store.setModal({ type: "confirmImport", file });
  });
  input.addEventListener("cancel", () => input.remove());
  document.body.appendChild(input);
  input.click();
}

/** "Copy Obsidian link": put `[[Name]]` on the clipboard. */
export function copyObsidianLink(name: string) {
  if (!navigator.clipboard) {
    store.notice("Could not copy the link.");
    return;
  }
  navigator.clipboard.writeText(`[[${name}]]`).then(
    () => store.notice("Link copied to clipboard."),
    () => store.notice("Could not copy the link.")
  );
}
