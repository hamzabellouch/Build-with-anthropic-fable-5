import type { Store } from "./store";
import { SCHEMA_VERSION, STORAGE_KEY, normalizeVaultData } from "./store";

/* Vault export / import. Pure data plumbing — the UX wave wires the buttons. */

function localDate(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

/** File-system-safe version of a note/folder name. */
const safeName = (name: string) => name.replace(/[/\\:*?"<>|]/g, "-").trim() || "Untitled";

/** Mirror the folder tree into a zip, one `<name>.md` per note. */
export async function exportVaultZip(store: Store): Promise<void> {
  // jszip is CommonJS (`export =`) — Vite's interop exposes the class as `default`
  const { default: JSZip } = await import("jszip");
  const zip = new JSZip();
  const { nodes } = store.state.vault;
  const walk = (ids: string[], prefix: string) => {
    const used = new Set<string>();
    for (const id of ids) {
      const node = nodes[id];
      if (!node) continue;
      let name = safeName(node.name);
      for (let i = 1; used.has(name.toLowerCase()); i++) name = `${safeName(node.name)} ${i}`;
      used.add(name.toLowerCase());
      if (node.type === "folder") {
        zip.folder(prefix + name);
        walk(node.children ?? [], `${prefix}${name}/`);
      } else {
        zip.file(`${prefix}${name}.md`, node.content ?? "");
      }
    }
  };
  walk(store.state.vault.root, "");
  const blob = await zip.generateAsync({ type: "blob" });
  download(blob, `obsidian-vault-${localDate()}.zip`);
}

/** Full-fidelity backup: the complete { schemaVersion, vault, ui } blob as JSON. */
export function exportVaultJSON(store: Store): void {
  const payload = JSON.stringify(
    { schemaVersion: SCHEMA_VERSION, vault: store.state.vault, ui: store.state.ui },
    null,
    2
  );
  download(new Blob([payload], { type: "application/json" }), `obsidian-vault-${localDate()}.json`);
}

/**
 * Import a JSON backup produced by exportVaultJSON (or a raw persisted blob).
 * Runs the same normalizer as load(); the current vault is backed up to
 * `<STORAGE_KEY>.pre-import-<epoch-ms>` before anything is replaced.
 */
export async function importVaultJSON(store: Store, file: File): Promise<boolean> {
  let normalized: ReturnType<typeof normalizeVaultData> = null;
  try {
    normalized = normalizeVaultData(JSON.parse(await file.text()));
  } catch {
    normalized = null;
  }
  if (!normalized) {
    store.notice("Import failed — not a readable vault backup.", { sticky: true });
    return false;
  }
  try {
    const current = localStorage.getItem(STORAGE_KEY);
    if (current != null) localStorage.setItem(`${STORAGE_KEY}.pre-import-${Date.now()}`, current);
  } catch {
    /* backup is best-effort — the old blob also survives under STORAGE_KEY until the next save */
  }
  store.importData(normalized.vault, normalized.ui);
  store.notice("Vault imported.");
  return true;
}
