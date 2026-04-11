import type { WorkspaceIsolationShellHookStatus } from "../types/electron.js";
import type { WorkspaceIsolationStack } from "../types/workspace-isolation.js";

export type WorkspaceIsolationDialogStep = 1 | 2 | 3;
export type WorkspaceIsolationIntroAction = "continue" | "enable-and-continue";

export interface WorkspaceIsolationDialogOpeningState {
  step: 1 | 2;
  requiresAutoEnvSetup: boolean;
}

export const requiresWorkspaceIsolationShellHooks = (
  shellHookStatus: WorkspaceIsolationShellHookStatus | null,
): boolean => Boolean(shellHookStatus?.supported && !shellHookStatus.enabled);

export const getWorkspaceIsolationIntroAction = (
  shellHookStatus: WorkspaceIsolationShellHookStatus | null,
): WorkspaceIsolationIntroAction =>
  requiresWorkspaceIsolationShellHooks(shellHookStatus)
    ? "enable-and-continue"
    : "continue";

export const getWorkspaceIsolationDialogInitialStep = (
  stack: WorkspaceIsolationStack | null | undefined,
  shellHookStatus: WorkspaceIsolationShellHookStatus | null,
): 1 | 2 => (stack || !requiresWorkspaceIsolationShellHooks(shellHookStatus) ? 2 : 1);

export const getWorkspaceIsolationDialogOpeningState = (
  stack: WorkspaceIsolationStack | null | undefined,
  shellHookStatus: WorkspaceIsolationShellHookStatus | null,
): WorkspaceIsolationDialogOpeningState => {
  const requiresAutoEnvSetup = Boolean(
    !stack && requiresWorkspaceIsolationShellHooks(shellHookStatus),
  );

  return {
    step: requiresAutoEnvSetup ? 1 : 2,
    requiresAutoEnvSetup,
  };
};
