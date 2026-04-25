import type { WorkspaceIsolationShellHookStatus } from "../types/electron.js";

export const WORKSPACE_ISOLATION_AUTO_ENV_RELOAD_COMMAND = "source ~/.zshrc";

export const WORKSPACE_ISOLATION_AUTO_ENV_RELOAD_INSTRUCTION =
  `Restart zsh or run ${WORKSPACE_ISOLATION_AUTO_ENV_RELOAD_COMMAND}.`;

export const getWorkspaceIsolationAutoEnvSuccessDescription = (): string =>
  `New terminals will pick it up automatically. Run this command to update an open shell.`;

export const getWorkspaceIsolationActivationReloadTitle = (
  workspaceLabel: string,
): string => `Reload zsh to use Project Services in ${workspaceLabel}`;

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
