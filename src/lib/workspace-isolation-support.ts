import type { WorkspaceIsolationShellHookStatus } from "../types/electron.js";
import type { WorkspaceActivationTarget } from "../types/workspace-isolation.js";

export const WORKSPACE_ISOLATION_AUTO_ENV_RELOAD_COMMAND = "source ~/.zshrc";

export const WORKSPACE_ISOLATION_AUTO_ENV_RELOAD_INSTRUCTION =
  `Restart zsh or run ${WORKSPACE_ISOLATION_AUTO_ENV_RELOAD_COMMAND}.`;

export const getWorkspaceIsolationActivationReloadTitle = (
  workspaceLabel: string,
): string => `Reload zsh to use Project Services in ${workspaceLabel}`;

export const getWorkspaceIsolationActivationReloadDescription = (
  workspaceLabel: string,
): string =>
  `Project Services is active for ${workspaceLabel}. ${WORKSPACE_ISOLATION_AUTO_ENV_RELOAD_INSTRUCTION}`;

export const getWorkspaceIsolationTopologyEditReloadTitle = (): string =>
  "Reload zsh if active services changed";

export const getWorkspaceIsolationTopologyEditReloadDescription = (): string =>
  "If this edit affects an activated workspace, copy and run the reload command in that terminal.";

export const shouldShowWorkspaceIsolationTopologyEditReloadToast = ({
  isEditing,
  shellHookStatus,
  activationTargets,
}: {
  isEditing: boolean;
  shellHookStatus: WorkspaceIsolationShellHookStatus | null;
  activationTargets: Pick<WorkspaceActivationTarget, "isActive">[];
}): boolean =>
  isEditing &&
  shellHookStatus?.enabled === true &&
  activationTargets.some((target) => target.isActive);

const defaultAutoEnvSetupMessage =
  "Install a managed zsh hook block in ~/.zshrc.";

const unsupportedAutoEnvMessage =
  "Terminal Auto-Env currently supports zsh only. Routed domains still work with manual setup.";

export const getWorkspaceIsolationAutoEnvBadgeLabel = (
  shellHookStatus: WorkspaceIsolationShellHookStatus | null,
): string => {
  if (!shellHookStatus?.supported) {
    return "Unsupported";
  }

  return shellHookStatus.enabled ? "Enabled" : "Needs setup";
};

export const getWorkspaceIsolationAutoEnvSummary = (
  shellHookStatus: WorkspaceIsolationShellHookStatus | null,
): string => {
  if (!shellHookStatus?.supported) {
    return unsupportedAutoEnvMessage;
  }

  if (!shellHookStatus.enabled) {
    return shellHookStatus.message ?? defaultAutoEnvSetupMessage;
  }

  const prefix = shellHookStatus.message ?? "Managed zsh hook installed.";
  return `${prefix} ${WORKSPACE_ISOLATION_AUTO_ENV_RELOAD_INSTRUCTION}`;
};
