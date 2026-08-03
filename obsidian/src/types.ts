export type NodeType = "folder" | "file";

export interface VaultNode {
  id: string;
  type: NodeType;
  name: string;
  parent: string | null;
  children?: string[];
  content?: string;
  icon?: string;
  color?: string;
}

/** A soft-deleted subtree, restorable from the trash. */
export interface TrashEntry {
  entryId: string;
  deletedAt: number; // epoch ms
  originalParent: string | null;
  originalPath: string; // display path at deletion time, e.g. "Videos/Scripts/Note"
  rootId: string;
  nodes: VaultNode[];
}

export interface Vault {
  nodes: Record<string, VaultNode>;
  root: string[];
  trash: TrashEntry[];
}

export type ViewMode = "live" | "reading";

export interface Tab {
  id: string;
  fileId: string | null;
  mode: ViewMode;
  history: (string | null)[];
  hIndex: number;
}

export type LeftTab = "files" | "search" | "bookmarks" | "recents";
export type RightTab = "backlinks" | "outline";
export type SortMode = "custom" | "az" | "za";

export interface Notice {
  id: number;
  msg: string;
  /** optional button rendered inside the notice (e.g. Undo after a delete) */
  action?: { label: string; run: () => void };
  /** sticky notices stay until dismissed explicitly */
  sticky?: boolean;
}

export interface PendingNav {
  fileId: string;
  selFrom?: number;
  selTo?: number;
  line?: number;
  heading?: string;
}

export type ModalState =
  | { type: "switcher" }
  | { type: "palette" }
  | { type: "confirmDelete"; id: string }
  | { type: "settings" }
  | { type: "trash" }
  | { type: "moveTo"; id: string }
  | { type: "confirmImport"; file: File }
  | null;

export interface Settings {
  fontSize: number; // px, drives --editor-font-size
  lineWidth: number; // px, drives --content-width
  accent: string; // CSS color, drives --accent and --link-color
  spellcheck: boolean; // consumed by the editor
}

export interface UIState {
  leftOpen: boolean;
  leftWidth: number;
  leftTab: LeftTab;
  rightOpen: boolean;
  rightWidth: number;
  rightTab: RightTab;
  tabs: Tab[];
  activeTab: string;
  expanded: Record<string, boolean>;
  bookmarks: string[];
  recents: string[];
  sort: SortMode;
  settings: Settings;
}

export interface AppState {
  vault: Vault;
  ui: UIState;
  renaming: string | null;
  modal: ModalState;
  notices: Notice[];
  namesVersion: number;
  /** bumped by every vault mutation — cheap memo key for vault-derived UI */
  vaultVersion: number;
}

export interface Command {
  id: string;
  label: string;
  hotkey?: string;
  run: () => void;
}
