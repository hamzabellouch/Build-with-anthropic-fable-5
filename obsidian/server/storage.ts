import { fileURLToPath } from "node:url";

/**
 * Storage abstraction for the sync server. A vault is one opaque JSON blob —
 * the same { schemaVersion, vault, ui } payload the web app keeps in
 * localStorage — plus a server-assigned revision counter. Writes are
 * compare-and-swap on `baseRev`, so two writers can never silently overwrite
 * each other: the loser gets the current row back and reconciles client-side.
 */

export interface VaultRow {
  rev: number;
  savedBy: string;
  /** JSON text of { schemaVersion, vault, ui } — opaque to the server */
  data: string;
  updatedAt: number; // epoch ms
}

export type PutResult =
  | { ok: true; rev: number }
  | { ok: false; current: VaultRow | null }; // current=null: the row vanished under us (wiped DB)

export interface VaultStorage {
  /** backend name surfaced by /api/health */
  readonly backend: string;
  init(): Promise<void>;
  get(id: string): Promise<VaultRow | null>;
  /** CAS write: applies only when the stored rev equals baseRev (baseRev 0 = create). */
  put(id: string, baseRev: number, savedBy: string, data: string): Promise<PutResult>;
  close(): Promise<void>;
}

export const DEFAULT_SQLITE_PATH = fileURLToPath(new URL("./data/vault.db", import.meta.url));
export const DEFAULT_POSTGRES_URL = "postgres://vault:vault@localhost:5433/vault";

/**
 * Pick a backend from the environment:
 *   VAULT_DB=sqlite (default)  → local file, zero dependencies (node:sqlite)
 *       SQLITE_PATH overrides the db file location
 *   VAULT_DB=postgres          → node-postgres pool
 *       DATABASE_URL overrides the connection string
 * Drivers are imported lazily so only the chosen one ever loads.
 */
export async function createStorage(env: NodeJS.ProcessEnv = process.env): Promise<VaultStorage> {
  const kind = (env.VAULT_DB ?? "sqlite").toLowerCase();
  if (kind === "postgres" || kind === "pg") {
    const { PostgresStorage } = await import("./postgres.ts");
    return new PostgresStorage(env.DATABASE_URL ?? DEFAULT_POSTGRES_URL);
  }
  if (kind === "sqlite") {
    const { SqliteStorage } = await import("./sqlite.ts");
    return new SqliteStorage(env.SQLITE_PATH ?? DEFAULT_SQLITE_PATH);
  }
  throw new Error(`Unknown VAULT_DB "${env.VAULT_DB}" — use "sqlite" or "postgres".`);
}
