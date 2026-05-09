import type { SyncTarget } from "@/types/sync-target";
import type { Workspace } from "@/types/workspace";

export interface StoredProject {
  id: string;
  name: string;
  path: string;
  isGitRepo: boolean;
  worktrees: number;
  workspaces?: Workspace[];
  syncTargets?: SyncTarget[];
  // Legacy persisted field kept for compatibility with older app versions.
  configFiles?: string[];
}
