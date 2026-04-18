import type {
  WorkspaceIsolationMode,
  WorkspaceIsolationConnection,
  WorkspaceIsolationService,
} from "../types/workspace-isolation.js";
import type { WorkspaceIsolationShellHookStatus } from "../types/electron.js";

export type WorkspaceIsolationAnalyticsSource =
  | "workspace-card"
  | "workspace-warning"
  | "settings-card"
  | "settings-info"
  | "onboarding"
  | "project-dialog";

export type WorkspaceIsolationActivationTargetKind = "base" | "workspace";

export type WorkspaceIsolationAnalyticsOpeningStep =
  | "intro"
  | "auto-env"
  | "configuration";

export type WorkspaceIsolationAnalyticsAutoEnvState =
  | "enabled"
  | "needs-setup"
  | "unsupported";

export interface WorkspaceIsolationAnalyticsSummary {
  workspaceMode: WorkspaceIsolationMode;
  serviceCount: number;
  connectionCount: number;
  externalConnectionCount: number;
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
