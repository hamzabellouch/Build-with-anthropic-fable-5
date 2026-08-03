import pg from "pg";
import type { PutResult, VaultRow, VaultStorage } from "./storage.ts";

/** Postgres backend over a node-postgres pool; one row per vault, CAS by rev. */
export class PostgresStorage implements VaultStorage {
  readonly backend = "postgres";
  private pool: pg.Pool;

  constructor(connectionString: string) {
    this.pool = new pg.Pool({ connectionString, max: 4 });
  }

  async init(): Promise<void> {
    await this.pool.query(
      `CREATE TABLE IF NOT EXISTS vaults (
        id TEXT PRIMARY KEY,
        rev BIGINT NOT NULL,
        saved_by TEXT NOT NULL DEFAULT '',
        data TEXT NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )`
    );
  }

  async get(id: string): Promise<VaultRow | null> {
    const r = await this.pool.query(
      `SELECT rev, saved_by, data, extract(epoch FROM updated_at) * 1000 AS updated_at
       FROM vaults WHERE id = $1`,
      [id]
    );
    const row = r.rows[0];
    if (!row) return null;
    return { rev: Number(row.rev), savedBy: row.saved_by, data: row.data, updatedAt: Number(row.updated_at) };
  }

  async put(id: string, baseRev: number, savedBy: string, data: string): Promise<PutResult> {
    if (baseRev === 0) {
      const r = await this.pool.query(
        "INSERT INTO vaults (id, rev, saved_by, data) VALUES ($1, 1, $2, $3) ON CONFLICT (id) DO NOTHING",
        [id, savedBy, data]
      );
      if (r.rowCount === 1) return { ok: true, rev: 1 };
    } else {
      const r = await this.pool.query(
        "UPDATE vaults SET rev = $1, saved_by = $2, data = $3, updated_at = now() WHERE id = $4 AND rev = $5",
        [baseRev + 1, savedBy, data, id, baseRev]
      );
      if (r.rowCount === 1) return { ok: true, rev: baseRev + 1 };
    }
    return { ok: false, current: await this.get(id) };
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}
