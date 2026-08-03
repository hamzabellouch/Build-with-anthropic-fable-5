import { Check, CloudOff, HardDrive, RefreshCw, TriangleAlert } from "lucide-react";
import { store } from "../store";
import { syncEngine, useSync } from "../persist/sync";
import type { SyncSnapshot, SyncStatusKind } from "../persist/sync";

function describe(s: SyncSnapshot): { icon: React.ReactNode; label: string; title: string } {
  switch (s.status) {
    case "off":
      return {
        icon: <HardDrive />,
        label: "Local only",
        title: "Sync is off — notes live in this browser only.\nClick to open settings.",
      };
    case "unreachable":
      return {
        icon: <CloudOff />,
        label: "Offline",
        title: `Sync server unreachable — everything still saves locally and will sync when it returns.\n(${s.detail})\nClick to retry.`,
      };
    case "syncing":
      return { icon: <RefreshCw className="spin" />, label: "Syncing…", title: "Syncing with the server…" };
    case "synced":
      return {
        icon: <Check />,
        label: "Synced",
        title:
          `Synced with ${s.url} (rev ${s.remoteRev})` +
          (s.lastSyncAt ? ` · ${new Date(s.lastSyncAt).toLocaleTimeString()}` : "") +
          "\nClick to sync now.",
      };
    case "error":
      return { icon: <TriangleAlert />, label: "Sync error", title: `${s.detail || "Sync error"}\nClick to retry.` };
  }
}

/** Status-bar chip for the sync state. Click = sync now (or open settings while off). */
export function SyncPill() {
  const s = useSync();
  const d = describe(s);
  const noisy: SyncStatusKind[] = ["unreachable", "error"];
  return (
    <button
      className={"sync-pill is-" + s.status + (noisy.includes(s.status) ? " is-attention" : "")}
      title={d.title}
      aria-label={`Sync status: ${d.label}`}
      onClick={() => (s.status === "off" ? store.setModal({ type: "settings" }) : syncEngine.kick())}
    >
      {d.icon}
      <span>{d.label}</span>
    </button>
  );
}
