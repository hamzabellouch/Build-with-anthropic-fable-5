# Obsidian (Web)

A working web recreation of [Obsidian](https://obsidian.md) — dark theme, live-preview Markdown editing, full RTL support, and the **Qomra** Arabic typeface (loaded for Arabic Unicode ranges only, so Latin text falls back to the system UI font, exactly like the desktop app).

## Run

```bash
npm install
npm run dev        # development (http://localhost:5173 or next free port)

npm run build      # type-check + production bundle into dist/
npm run preview    # serve the production build
```

The vault is persisted to `localStorage` and seeded on first run with the demo vault (Videos/Scripts with Arabic notes, استشارات/المنهاج, etc.). To reset to the seed: clear site data (or `localStorage.clear()` in DevTools) and reload.

## Database sync (optional)

The app is **local-first**: every keystroke saves to `localStorage` and everything works with no
server at all. Optionally, a tiny bundled sync server mirrors the vault into a real database —
SQLite (a local file, zero dependencies) or Postgres — giving durability beyond the browser and
sync across browsers/devices pointed at the same server.

```bash
npm run server       # SQLite backend (default) → server/data/vault.db, port 4870
npm run server:pg    # Postgres backend (DATABASE_URL, default postgres://vault:vault@localhost:5433/vault)

npm run pg:up        # spawn the Postgres container via podman (host network, listens on localhost:5433)
npm run pg:down      # remove it

npm run test:server       # storage-contract tests (sqlite + HTTP; add PG=1 for postgres)
npm run typecheck:server  # tsc over server/
```

In dev, Vite proxies `/api` to `localhost:4870`, so just run `npm run dev` and `npm run server`
side by side. The status-bar pill shows the live state (Synced / Syncing / Offline / Local only);
Settings has the toggle, the server URL, and "Sync now".

**How it works**

- The server is dependency-light (`node:http` + built-in `node:sqlite`; `pg` only for Postgres),
  written in TypeScript and run natively by Node ≥ 23 — no build step. It stores each vault as one
  opaque JSON blob behind a `VaultStorage` interface (`server/storage.ts`); backends are selected
  with `VAULT_DB=sqlite|postgres`.
- Writes are compare-and-swap on a server-assigned revision: a stale writer gets a 409 plus the
  current row and reconciles client-side — concurrent writers can't silently lose updates.
- The client engine (`src/persist/sync.ts`, behind the `RemoteVaultBackend` interface in
  `src/persist/backend.ts`) pushes ~1s after each save, polls every 15s while visible, and adopts
  newer server revisions the same way it adopts sibling-tab saves.
- Offline or no server → the pill shows the state and the app just keeps working locally; it
  catches up automatically when the server returns.
- Real conflicts (another device pushed first) keep the same whole-blob last-writer-wins policy as
  cross-tab saves, but never destructively: your version is backed up locally and a sticky notice
  offers **Restore mine**, which re-imports and re-pushes it.
- A server whose revision moved *backwards* (wiped or swapped database) is republished over from
  local data — local-first means the browser copy is the lineage that wins.
- Sync settings (server URL, on/off, sync point) are device-local and never part of the synced
  blob. The blob itself is validated by the same defensive normalizer used for `localStorage`.

> Note: `pg:up` uses `--network=host` because rootless podman's usermode networking (pasta) needs
> `/dev/net/tun`, which isn't available on every machine. With host networking Postgres binds
> `localhost:5433` directly.

## Features

**Editor (CodeMirror 6 — the same engine real Obsidian uses)**
- Live Preview: Markdown syntax hides until the cursor touches it (headings, bold/italic/strikethrough, inline code, links, quotes, fences)
- Per-line RTL/LTR auto direction — Arabic lines align right, English lines align left, in the same note; code blocks and tables stay LTR
- `[[Wikilink` **autocompletion** with Arabic-aware fuzzy ranking, folder paths, and `#heading` anchors; auto-closing brackets
- **Hover page previews** of linked notes (editor and reading view)
- Plain click follows rendered links; Ctrl/Cmd+click opens in a new tab; unresolved links create the note; renaming a note **rewrites all inbound links**
- Per-tab editor state cache: undo history, cursor, and scroll survive tab switches and mode toggles
- Clickable task checkboxes that rewrite `- [ ]` / `- [x]` in the source
- Reading view (Ctrl+E) via markdown-it: tables, task lists (still toggleable), wikilinks, per-block direction
- In-editor find: Ctrl+F

**Workspace**
- Tabs: open/close/switch/drag-reorder, middle-click close, context menu, tab-list dropdown, per-tab back/forward history
- File explorer: drag-and-drop moves (folders auto-expand on hover), full keyboard navigation (arrows / Enter / F2 / Delete), colored folder icons, inline rename, "Move to..." picker, Duplicate, Copy Obsidian link, sort menu
- Global search (Ctrl+Shift+F): diacritic- and hamza-insensitive Arabic matching, results refresh live as you type in notes, click opens + selects the match
- Right sidebar: Outline (click to jump) and Backlinks with jump-to-mention
- Quick switcher (Ctrl+O), command palette (Ctrl+P), bookmarks, recent files
- **Settings** (gear icon): editor font size, line width, accent color, spellcheck — applied live and persisted

**Data safety (it's a daily tool)**
- Crash-proof persistence: schema-versioned saves, deep validation on load, corrupt blobs backed up to a recovery key instead of lost
- Multi-tab safe: rev-stamped writes + live adoption via storage events — a second browser tab can no longer clobber the vault
- Saves flush synchronously on tab close/hide (no debounce-window data loss); storage-quota failures surface a sticky warning
- Deletes are soft: trash with Undo notice, restore, and empty (command palette → "Open trash")
- Export the vault as a Markdown .zip or JSON backup; import a backup (palette or the ⋮ menu)
- Error boundaries: a render crash shows a recovery screen ("your notes are saved") instead of a white page

**Shortcuts:** Ctrl+O switcher · Ctrl+P palette · Alt+N new note · Ctrl+E toggle reading · Alt+T new tab · Alt+W close tab · Ctrl+Shift+F search · Ctrl+F find in note

## Stack

Vite · React 18 · TypeScript · CodeMirror 6 · markdown-it · lucide icons (the icon set Obsidian itself uses)

Sync server: Node ≥ 23 (native TS, `node:http`, `node:sqlite`) · `pg` · podman for the Postgres container
