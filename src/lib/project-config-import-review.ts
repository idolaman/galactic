import type { ProjectConfigImportAction } from "./project-config.js";
import { getWorkspaceIsolationTopologyId } from "./workspace-isolation-helpers.js";
import type { SyncTarget } from "../types/sync-target.js";
import type { WorkspaceIsolationProjectTopology } from "../types/workspace-isolation.js";

export type ProjectConfigServicesReviewKind = "save" | "remove" | "none";

export interface ProjectConfigImportReview {
  action: ProjectConfigImportAction;
  syncTargetCount: number;
  currentSyncTargetCount: number;
  serviceCount: number;
  currentServiceCount: number;
  externalConnectionCount: number;
  servicesKind: ProjectConfigServicesReviewKind;
}

export const buildProjectConfigImportReview = ({
  action,
  currentSyncTargets,
  currentTopology,
}: {
  action: ProjectConfigImportAction;
  currentSyncTargets: SyncTarget[];
  currentTopology: WorkspaceIsolationProjectTopology | null;
}): ProjectConfigImportReview => {
  const currentTopologyId =
    action.projectServices.type === "save"
      ? getWorkspaceIsolationTopologyId(action.projectServices.input.projectId)
      : null;
  const services =
    action.projectServices.type === "save"
      ? action.projectServices.input.services
      : [];
  const servicesKind =
    action.projectServices.type === "save"
      ? "save"
      : currentTopology
        ? "remove"
        : "none";

  return {
    action,
    syncTargetCount: action.syncTargets.length,
    currentSyncTargetCount: currentSyncTargets.length,
    serviceCount: services.length,
    currentServiceCount: currentTopology?.services.length ?? 0,
    externalConnectionCount: currentTopologyId
      ? services.reduce(
          (count, service) =>
            count +
            service.connections.filter(
              (connection) => connection.targetStackId !== currentTopologyId,
            ).length,
          0,
        )
      : 0,
    servicesKind,
  };
};
