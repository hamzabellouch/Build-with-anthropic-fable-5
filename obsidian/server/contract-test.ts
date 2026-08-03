import { rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { buildServer } from "./index.ts";
import { DEFAULT_POSTGRES_URL, type VaultStorage } from "./storage.ts";
import { SqliteStorage } from "./sqlite.ts";

/**
 * Contract test: every VaultStorage implementation must behave identically,
 * plus a smoke test of the HTTP layer over the sqlite backend.
 *
 *   node server/contract-test.ts                  → sqlite + HTTP
 *   PG=1 node server/contract-test.ts             → also postgres (DATABASE_URL
 *                                                   or the default podman URL)
 */

let failures = 0;
function ok(cond: boolean, label: string) {
  console.log(cond ? "  ✓" : "  ✗ FAIL:", label);
  if (!cond) failures++;
}

const blob = (marker: string) =>
  JSON.stringify({ schemaVersion: 2, vault: { nodes: {}, root: [], trash: [] }, ui: { marker } });

/** fetch().json() is typed `unknown`; the smoke test asserts shapes dynamically */
const j = (r: Response): Promise<any> => r.json() as Promise<any>;

async function storageContract(storage: VaultStorage, id: string) {
  await storage.init();
  ok((await storage.get(id)) === null, "missing vault → null");

  const created = await storage.put(id, 0, "tab-a", blob("v1"));
  ok(created.ok && created.rev === 1, "create at baseRev 0 → rev 1");

  const dupCreate = await storage.put(id, 0, "tab-b", blob("v1b"));
  ok(!dupCreate.ok && dupCreate.current?.rev === 1, "second create conflicts, returns rev 1");

  const updated = await storage.put(id, 1, "tab-a", blob("v2"));
  ok(updated.ok && updated.rev === 2, "CAS update from rev 1 → rev 2");

  const stale = await storage.put(id, 1, "tab-b", blob("v2-stale"));
  ok(!stale.ok && stale.current?.rev === 2 && stale.current.data === blob("v2"), "stale baseRev rejected with current row");

  const row = await storage.get(id);
  ok(row?.rev === 2 && row.savedBy === "tab-a" && row.data === blob("v2"), "get returns the stored row");
  ok(typeof row?.updatedAt === "number" && row.updatedAt > 0, "updatedAt is set");

  const other = await storage.put(`${id}-b`, 0, "x", blob("other"));
  ok(other.ok && other.rev === 1, "vault ids are independent");
}

async function httpSmoke(storage: VaultStorage) {
  await storage.init();
  const server = buildServer(storage);
  await new Promise<void>((res) => server.listen(0, res));
  const addr = server.address();
  const base = `http://localhost:${typeof addr === "object" && addr ? addr.port : 0}/api`;

  const health = await j(await fetch(`${base}/health`));
  ok(health.ok === true && health.backend === "sqlite", "GET /health");

  ok((await fetch(`${base}/vault/default`)).status === 404, "GET missing vault → 404");

  const payload = { schemaVersion: 2, vault: { nodes: {}, root: [], trash: [] }, ui: { from: "http" } };
  const put = await fetch(`${base}/vault/default`, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ baseRev: 0, savedBy: "smoke", data: payload }),
  });
  ok(put.status === 200 && (await j(put)).rev === 1, "PUT create → 200 rev 1");

  const get = await fetch(`${base}/vault/default`);
  const etag = get.headers.get("etag");
  const got = await j(get);
  ok(get.status === 200 && got.rev === 1 && got.data.ui.from === "http", "GET returns row with embedded data");
  ok(etag === '"v1"', "ETag mirrors rev");

  const notModified = await fetch(`${base}/vault/default`, { headers: { "if-none-match": etag! } });
  ok(notModified.status === 304, "GET with matching If-None-Match → 304");

  const conflict = await fetch(`${base}/vault/default`, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ baseRev: 0, savedBy: "smoke2", data: payload }),
  });
  const conflictBody = await j(conflict);
  ok(conflict.status === 409 && conflictBody.rev === 1 && conflictBody.data.ui.from === "http", "stale PUT → 409 with current row");

  const bad = await fetch(`${base}/vault/default`, { method: "PUT", body: "not json" });
  ok(bad.status === 400, "non-JSON body → 400");

  const badId = await fetch(`${base}/vault/${encodeURIComponent("../etc")}`);
  ok(badId.status === 400, "invalid vault id → 400");

  ok((await fetch(`${base}/nope`)).status === 404, "unknown route → 404");

  await new Promise<void>((res) => server.close(() => res()));
}

const stamp = `${process.pid}-${Date.now()}`;

console.log("sqlite storage contract");
const sqlitePath = join(tmpdir(), `vault-contract-${stamp}.db`);
const sqlite = new SqliteStorage(sqlitePath);
await storageContract(sqlite, "contract");
await sqlite.close();

console.log("http smoke (sqlite backend)");
const httpDbPath = join(tmpdir(), `vault-http-${stamp}.db`);
const httpStorage = new SqliteStorage(httpDbPath);
await httpSmoke(httpStorage);
await httpStorage.close();
for (const p of [sqlitePath, httpDbPath]) {
  for (const suffix of ["", "-wal", "-shm"]) rmSync(p + suffix, { force: true });
}

if (process.env.PG === "1" || process.env.VAULT_DB === "postgres" || process.env.DATABASE_URL) {
  console.log("postgres storage contract");
  const { PostgresStorage } = await import("./postgres.ts");
  const postgres = new PostgresStorage(process.env.DATABASE_URL ?? DEFAULT_POSTGRES_URL);
  // unique id per run — leftover rows in the test database are harmless
  await storageContract(postgres, `contract-${stamp}`);
  await postgres.close();
} else {
  console.log("postgres storage contract — skipped (set PG=1 with a running database)");
}

console.log(failures === 0 ? "ALL PASS" : `${failures} FAILURE(S)`);
process.exit(failures === 0 ? 0 : 1);
