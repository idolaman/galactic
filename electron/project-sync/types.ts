// NOTE: Keep this file in sync with src/types/sync-target.ts.
// The renderer and Electron main currently use separate tsconfig/module boundaries.
export type SyncTargetKind = "file" | "directory";

export interface SyncTarget {
  path: string;
  kind: SyncTargetKind;
}

export interface CopySyncTargetError {
  path: string;
  message: string;
}

export interface CopySyncTargetsResult {
  success: boolean;
  copied: string[];
  skipped: string[];
  errors?: CopySyncTargetError[];
}
