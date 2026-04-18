import type { WorkspaceIsolationShellHookStatus } from "../types/electron.js";

export type WorkspaceIsolationDialogStep = 1 | 2 | 3 | 4 | 5;

export interface WorkspaceIsolationDialogOpeningState {
  step: 1 | 2 | 3;
  showFeatureIntroStep: boolean;
  requiresAutoEnvSetup: boolean;
}

export const requiresWorkspaceIsolationShellHooks = (
  shellHookStatus: WorkspaceIsolationShellHookStatus | null,
): boolean => Boolean(shellHookStatus?.supported && !shellHookStatus.enabled);

export const getWorkspaceIsolationDialogOpeningState = (
  shellHookStatus: WorkspaceIsolationShellHookStatus | null,
  workspaceIsolationIntroSeen: boolean,
): WorkspaceIsolationDialogOpeningState => {
  const requiresAutoEnvSetup = requiresWorkspaceIsolationShellHooks(
    shellHookStatus,
  );
  const showFeatureIntroStep = requiresAutoEnvSetup && !workspaceIsolationIntroSeen;

  return {
    step: showFeatureIntroStep ? 1 : requiresAutoEnvSetup ? 2 : 3,
    showFeatureIntroStep,
    requiresAutoEnvSetup,
  };
};
