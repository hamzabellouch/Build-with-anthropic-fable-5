import type { UIState, Vault } from "../types";

/**
 * Client half of the storage abstraction. localStorage is always the primary,
 * synchronous store (local-first — the app never waits on the network); a
 * RemoteVaultBackend mirrors the same whole-vault blob to durable storage.
 * The bundled server (server/) backs this with SQLite or Postgres, but any
 * service that can hold "one JSON blob + a revision with CAS writes" can
 * implement the interface.
 */

/** the whole-vault payload that is persisted locally and remotely */
export interface VaultPayload {
  schemaVersion: number;
  vault: Vault;
  ui: UIState;
}

export type FetchResult =
  | { status: "ok"; rev: number; data: unknown }
  | { status: "unchanged" } // server still at the rev we passed in
  | { status: "empty" }; // no vault stored remotely yet

export type PushResult =
  | { status: "ok"; rev: number }
  // current server row; rev 0 / data null when the row vanished server-side
  | { status: "conflict"; rev: number; data: unknown };

export interface RemoteVaultBackend {
  /** fetch the remote vault; pass knownRev to allow a cheap 304-style "unchanged" */
  fetch(knownRev: number | null): Promise<FetchResult>;
  /** CAS write: applied only if the server is still at baseRev (0 = create) */
  push(baseRev: number, savedBy: string, payload: VaultPayload): Promise<PushResult>;
}
