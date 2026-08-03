import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { DatabaseSync, type StatementSync } from "node:sqlite";
import type { PutResult, VaultRow, VaultStorage } from "./storage.ts";

/** Local-file backend over the built-in node:sqlite — zero native dependencies. */
export class SqliteStorage implements VaultStorage {
  readonly backend = "sqlite";
  private path: string;
  private db: DatabaseSync | null = null;
  private stmts: { get: StatementSync; insert: StatementSync; update: StatementSync } | null = null;

  constructor(path: string) {
    this.path = path;
  }

  async init(): Promise<void> {
    mkdirSync(dirname(this.path), { recursive: true });
    const db = new DatabaseSync(this.path);
    db.exec("PRAGMA journal_mode = WAL;");
    db.exec(
      `CREATE TABLE IF NOT EXISTS vaults (
        id TEXT PRIMARY KEY,
        rev INTEGER NOT NULL,
        saved_by TEXT NOT NULL DEFAULT '',
        data TEXT NOT NULL,
        updated_at INTEGER NOT NULL
      )`
    );
    this.db = db;
    this.stmts = {
      get: db.prepare("SELECT rev, saved_by, data, updated_at FROM vaults WHERE id = ?"),
      insert: db.prepare(
        "INSERT OR IGNORE INTO vaults (id, rev, saved_by, data, updated_at) VALUES (?, 1, ?, ?, ?)"
      ),
      update: db.prepare(
        "UPDATE vaults SET rev = ?, saved_by = ?, data = ?, updated_at = ? WHERE id = ? AND rev = ?"
      ),
    };
  }

  private ready() {
    if (!this.stmts) throw new Error("SqliteStorage used before init()");
    return this.stmts;
  }

  async get(id: string): Promise<VaultRow | null> {
    const row = this.ready().get.get(id) as
      | { rev: number | bigint; saved_by: string; data: string; updated_at: number | bigint }
      | undefined;
    if (!row) return null;
    return { rev: Number(row.rev), savedBy: row.saved_by, data: row.data, updatedAt: Number(row.updated_at) };
  }

  async put(id: string, baseRev: number, savedBy: string, data: string): Promise<PutResult> {
    const stmts = this.ready();
    const now = Date.now();
    if (baseRev === 0) {
      if (Number(stmts.insert.run(id, savedBy, data, now).changes) === 1) return { ok: true, rev: 1 };
    } else {
      const r = stmts.update.run(baseRev + 1, savedBy, data, now, id, baseRev);
      if (Number(r.changes) === 1) return { ok: true, rev: baseRev + 1 };
    }
    return { ok: false, current: await this.get(id) };
  }

  async close(): Promise<void> {
    this.db?.close();
    this.db = null;
    this.stmts = null;
  }
}
