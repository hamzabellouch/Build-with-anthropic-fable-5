import type { FetchResult, PushResult, RemoteVaultBackend, VaultPayload } from "./backend";

/** Talks to the bundled sync server (server/) over its tiny JSON API. */
export class HttpVaultBackend implements RemoteVaultBackend {
  private base: string;
  private vaultId: string;

  constructor(baseUrl: string, vaultId = "default") {
    this.base = baseUrl.replace(/\/+$/, "");
    this.vaultId = vaultId;
  }

  private url(): string {
    return `${this.base}/vault/${encodeURIComponent(this.vaultId)}`;
  }

  async fetch(knownRev: number | null): Promise<FetchResult> {
    const headers: Record<string, string> = {};
    if (knownRev != null && knownRev > 0) headers["if-none-match"] = `"v${knownRev}"`;
    const res = await window.fetch(this.url(), { headers });
    if (res.status === 304) return { status: "unchanged" };
    if (res.status === 404) return { status: "empty" };
    if (!res.ok) throw new Error(`Sync server error ${res.status}`);
    const body = await this.json(res);
    if (typeof body?.rev !== "number") throw new Error("Sync server returned an unexpected payload");
    return { status: "ok", rev: body.rev, data: body.data };
  }

  async push(baseRev: number, savedBy: string, payload: VaultPayload): Promise<PushResult> {
    const res = await window.fetch(this.url(), {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ baseRev, savedBy, data: payload }),
    });
    if (res.status === 409) {
      const body = await this.json(res);
      return { status: "conflict", rev: typeof body?.rev === "number" ? body.rev : 0, data: body?.data ?? null };
    }
    if (!res.ok) throw new Error(`Sync server error ${res.status}`);
    const body = await this.json(res);
    if (typeof body?.rev !== "number") throw new Error("Sync server returned an unexpected payload");
    return { status: "ok", rev: body.rev };
  }

  /** static hosts answer /api with index.html — treat non-JSON bodies as "no server" */
  private async json(res: Response): Promise<any> {
    try {
      return await res.json();
    } catch {
      throw new Error("Sync server returned a non-JSON response");
    }
  }
}
