import type { WorkspaceIsolationMode } from "../types/workspace-isolation.js";

export const WORKSPACE_ISOLATION_DIALOG_CONTENT_CLASS_NAME =
  "flex h-[78vh] max-h-[42rem] max-w-3xl flex-col";

export const isSingleAppOverviewStep = (
  step: 1 | 2 | 3 | 4,
  workspaceMode: WorkspaceIsolationMode,
): boolean => step === 3 && workspaceMode === "single-app";
