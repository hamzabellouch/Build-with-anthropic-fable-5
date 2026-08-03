import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createStorage, type VaultRow, type VaultStorage } from "./storage.ts";

/**
 * Sync server for the web vault. Deliberately tiny and dependency-free:
 *   GET  /api/health      → { ok, backend }
 *   GET  /api/vault/:id   → { rev, savedBy, updatedAt, data } (ETag/304 aware)
 *   PUT  /api/vault/:id   → body { baseRev, savedBy, data } — CAS write;
 *                           200 { rev } on success, 409 + current row when stale
 * The vault blob itself stays opaque — all validation/normalization lives in
 * the client, which already treats every loaded blob as untrusted.
 */

const MAX_BODY = 32 * 1024 * 1024;
const VAULT_ID = /^[\w-]{1,64}$/;

class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function send(res: ServerResponse, status: number, body: string, headers: Record<string, string> = {}) {
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET, PUT, OPTIONS",
    "access-control-allow-headers": "content-type, if-none-match",
    ...headers,
  });
  res.end(body);
}

const sendJSON = (res: ServerResponse, status: number, value: unknown) => send(res, status, JSON.stringify(value));

/** Serialize a row, splicing the stored JSON text in verbatim (it was validated on PUT). */
function rowBody(row: VaultRow): string {
  return `{"rev":${row.rev},"savedBy":${JSON.stringify(row.savedBy)},"updatedAt":${row.updatedAt},"data":${row.data}}`;
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((res, rej) => {
    const chunks: Buffer[] = [];
    let size = 0;
    req.on("data", (c: Buffer) => {
      size += c.length;
      if (size > MAX_BODY) {
        rej(new HttpError(413, "Body too large"));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on("end", () => res(Buffer.concat(chunks).toString("utf8")));
    req.on("error", rej);
  });
}

async function route(storage: VaultStorage, req: IncomingMessage, res: ServerResponse): Promise<void> {
  const url = new URL(req.url ?? "/", "http://local");
  if (req.method === "OPTIONS") return send(res, 204, "");
  if (req.method === "GET" && url.pathname === "/api/health") {
    return sendJSON(res, 200, { ok: true, backend: storage.backend });
  }

  const m = url.pathname.match(/^\/api\/vault\/([^/]+)$/);
  if (!m) throw new HttpError(404, "Not found");
  const id = decodeURIComponent(m[1]);
  if (!VAULT_ID.test(id)) throw new HttpError(400, "Invalid vault id");

  if (req.method === "GET") {
    const row = await storage.get(id);
    if (!row) throw new HttpError(404, "No such vault");
    const etag = `"v${row.rev}"`;
    if (req.headers["if-none-match"]?.includes(etag)) return send(res, 304, "", { etag });
    return send(res, 200, rowBody(row), { etag });
  }

  if (req.method === "PUT") {
    let body: any;
    try {
      body = JSON.parse(await readBody(req));
    } catch (err) {
      if (err instanceof HttpError) throw err;
      throw new HttpError(400, "Body is not valid JSON");
    }
    const baseRev = body?.baseRev;
    if (typeof baseRev !== "number" || !Number.isInteger(baseRev) || baseRev < 0) {
      throw new HttpError(400, "baseRev must be a non-negative integer");
    }
    // light sanity only — the client normalizes everything it loads anyway
    if (!body.data || typeof body.data !== "object" || typeof body.data.vault !== "object") {
      throw new HttpError(400, "data must be a { schemaVersion, vault, ui } payload");
    }
    const savedBy = typeof body.savedBy === "string" ? body.savedBy.slice(0, 100) : "";
    const result = await storage.put(id, baseRev, savedBy, JSON.stringify(body.data));
    if (result.ok) return sendJSON(res, 200, { rev: result.rev });
    const cur = result.current;
    return send(res, 409, cur ? rowBody(cur) : `{"rev":0,"savedBy":"","updatedAt":0,"data":null}`);
  }

  throw new HttpError(405, "Method not allowed");
}

export function buildServer(storage: VaultStorage): Server {
  return createServer((req, res) => {
    route(storage, req, res).catch((err) => {
      const status = err instanceof HttpError ? err.status : 500;
      if (status === 500) console.error("[vault-server]", err);
      if (!res.headersSent) sendJSON(res, status, { error: err?.message ?? "Internal error" });
      else res.end();
    });
  });
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const storage = await createStorage();
  await storage.init();
  const port = Number(process.env.PORT ?? 4870);
  const server = buildServer(storage);
  server.listen(port, () => {
    console.log(`[vault-server] ${storage.backend} backend listening on http://localhost:${port}`);
  });
  const shutdown = () => {
    server.close(() => void storage.close().finally(() => process.exit(0)));
    setTimeout(() => process.exit(0), 1500).unref();
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}
