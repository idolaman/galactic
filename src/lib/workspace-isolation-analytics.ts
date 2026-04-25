import type {
  WorkspaceIsolationMode,
  WorkspaceIsolationConnection,
  WorkspaceIsolationService,
} from "../types/workspace-isolation.js";
import type { WorkspaceIsolationShellHookStatus } from "../types/electron.js";
import type {
  WorkspaceIsolationWorkspaceReason,
  WorkspaceIsolationWorkspaceStatus,
} from "./workspace-isolation-status.js";

export type WorkspaceIsolationAnalyticsSource =
  | "workspace-card"
  | "workspace-warning"
  | "settings-card"
  | "settings-info"
  | "onboarding"
  | "project-dialog";

export type WorkspaceIsolationActivationTargetKind = "base" | "workspace";
export type WorkspaceIsolationStateViewedState =
  | "ready_to_activate"
  | "active"
  | "needs_attention"
  | "blocked";

export type WorkspaceIsolationAnalyticsOpeningStep =
  | "intro"
  | "auto-env"
  | "configuration";

export type WorkspaceIsolationAnalyticsAutoEnvState =
  | "enabled"
  | "needs-setup"
  | "unsupported";
export type WorkspaceIsolationSupportAnalyticsReason =
  | WorkspaceIsolationWorkspaceReason
  | "none";

export interface WorkspaceIsolationAnalyticsSummary {
  workspaceMode: WorkspaceIsolationMode;
  serviceCount: number;
  connectionCount: number;
  externalConnectionCount: number;
}

export interface WorkspaceIsolationSupportAnalyticsSummary {
  targetKind: WorkspaceIsolationActivationTargetKind;
  reason: WorkspaceIsolationSupportAnalyticsReason;
  hasDependencies: boolean;
  hasNonLiveDependencies: boolean;
}

const isCompleteConnection = (
  service: WorkspaceIsolationService,
  stackId: string,
) =>
  service.connections.filter(
    (connection: WorkspaceIsolationConnection) =>
      Boolean(
        connection.envKey.trim() &&
          connection.targetStackId &&
          connection.targetServiceId &&
          connection.targetStackId !== stackId,
      ),
  ).length;

export const getWorkspaceIsolationAnalyticsAutoEnvState = (
  shellHookStatus: WorkspaceIsolationShellHookStatus | null,
): WorkspaceIsolationAnalyticsAutoEnvState => {
  if (!shellHookStatus?.supported) {
    return "unsupported";
  }

  return shellHookStatus.enabled ? "enabled" : "needs-setup";
};

export const getWorkspaceIsolationAnalyticsOpeningStep = (
  step: 1 | 2 | 3 | 4 | 5,
): WorkspaceIsolationAnalyticsOpeningStep =>
  step === 1 ? "intro" : step === 2 ? "auto-env" : "configuration";

export const getWorkspaceIsolationSupportAnalyticsReason = (
  reason: WorkspaceIsolationWorkspaceReason | null,
): WorkspaceIsolationSupportAnalyticsReason => reason ?? "none";

export const getWorkspaceIsolationSupportAnalyticsSummary = (
  targetKind: WorkspaceIsolationActivationTargetKind,
  status: WorkspaceIsolationWorkspaceStatus,
): WorkspaceIsolationSupportAnalyticsSummary => ({
  targetKind,
  reason: getWorkspaceIsolationSupportAnalyticsReason(status.reason),
  hasDependencies: status.hasDependencies,
  hasNonLiveDependencies: status.hasNonLiveDependencies,
});

export const getWorkspaceIsolationSupportAnalyticsFingerprint = (
  workspacePath: string,
  status: WorkspaceIsolationWorkspaceStatus,
): string =>
  [
    workspacePath,
    status.state,
    getWorkspaceIsolationSupportAnalyticsReason(status.reason),
    status.hasDependencies ? "dependencies" : "no-dependencies",
    status.hasNonLiveDependencies ? "non-live" : "all-live",
  ].join(":");

export const getWorkspaceIsolationAnalyticsSummary = (
  stackId: string,
  workspaceMode: WorkspaceIsolationMode,
  services: WorkspaceIsolationService[],
): WorkspaceIsolationAnalyticsSummary => ({
  workspaceMode,
  serviceCount: services.length,
  connectionCount: services.reduce(
    (count, service) =>
      count +
      service.connections.filter(
        (connection: WorkspaceIsolationConnection) =>
          Boolean(
            connection.envKey.trim() &&
              connection.targetStackId &&
              connection.targetServiceId,
          ),
      ).length,
    0,
  ),
  externalConnectionCount: services.reduce(
    (count, service) => count + isCompleteConnection(service, stackId),
    0,
  ),
});
