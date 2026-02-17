export type SyncTargetKind = "file" | "directory";

export interface SyncTarget {
  path: string;
  kind: SyncTargetKind;
}

export interface CopySyncTargetsResult {
  success: boolean;
  copied: string[];
  skipped: string[];
  errors?: Array<{ file: string; message: string }>;
}
