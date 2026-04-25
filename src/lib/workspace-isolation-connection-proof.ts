import { buildWorkspaceIsolationUrl } from "./workspace-isolation-routing.js";
import type {
  WorkspaceIsolationConnection,
  WorkspaceIsolationProjectTopology,
  WorkspaceIsolationService,
  WorkspaceIsolationStack,
} from "../types/workspace-isolation.js";

export type WorkspaceIsolationConnectionProofStatus =
  | "live_target"
  | "configured_target"
  | "missing_target";

export interface WorkspaceIsolationConnectionProof
  extends WorkspaceIsolationConnection {
  status: WorkspaceIsolationConnectionProofStatus;
  targetName: string;
  targetProjectName: string;
  targetWorkspaceLabel: string;
  targetUrl: string | null;
}

const MISSING_TARGET = {
  projectName: "Missing project",
  serviceName: "Missing target",
  workspaceLabel: "Missing workspace",
};

const findLiveTarget = (
  workspaceIsolationStacks: WorkspaceIsolationStack[],
  connection: WorkspaceIsolationConnection,
) => {
  const targetStack = workspaceIsolationStacks.find(
    (stack) => stack.id === connection.targetStackId,
  );
  const targetService = targetStack?.services.find(
    (service) => service.id === connection.targetServiceId,
  );

  if (!targetStack || !targetService) {
    return null;
  }

  return {
    stack: targetStack,
    service: targetService,
  };
};

const findConfiguredTarget = (
  workspaceIsolationProjectTopologies: WorkspaceIsolationProjectTopology[],
  connection: WorkspaceIsolationConnection,
) => {
  const targetTopology = workspaceIsolationProjectTopologies.find(
    (topology) => topology.id === connection.targetStackId,
  );
  const targetService = targetTopology?.services.find(
    (service) => service.id === connection.targetServiceId,
  );

  if (!targetTopology || !targetService) {
    return null;
  }

  return {
    topology: targetTopology,
    service: targetService,
  };
};

export const resolveWorkspaceIsolationConnections = ({
  service,
  workspaceIsolationProjectTopologies,
  workspaceIsolationStacks,
}: {
  service: WorkspaceIsolationService;
  workspaceIsolationProjectTopologies: WorkspaceIsolationProjectTopology[];
  workspaceIsolationStacks: WorkspaceIsolationStack[];
}): WorkspaceIsolationConnectionProof[] =>
  service.connections.flatMap<WorkspaceIsolationConnectionProof>((connection) => {
    const envKey = connection.envKey.trim();
    if (!envKey) {
      return [];
    }

    const liveTarget = findLiveTarget(workspaceIsolationStacks, connection);
    if (liveTarget) {
      return [{
        ...connection,
        envKey,
        status: "live_target",
        targetName: liveTarget.service.name,
        targetProjectName: liveTarget.stack.projectName,
        targetWorkspaceLabel: liveTarget.stack.workspaceRootLabel,
        targetUrl: buildWorkspaceIsolationUrl(
          liveTarget.stack,
          liveTarget.service,
        ),
      }];
    }

    const configuredTarget = findConfiguredTarget(
      workspaceIsolationProjectTopologies,
      connection,
    );
    if (configuredTarget) {
      return [{
        ...connection,
        envKey,
        status: "configured_target",
        targetName: configuredTarget.service.name,
        targetProjectName: configuredTarget.topology.projectName,
        targetWorkspaceLabel: configuredTarget.topology.workspaceRootLabel,
        targetUrl: null,
      }];
    }

    return [{
      ...connection,
      envKey,
      status: "missing_target",
      targetName: MISSING_TARGET.serviceName,
      targetProjectName: MISSING_TARGET.projectName,
      targetWorkspaceLabel: MISSING_TARGET.workspaceLabel,
      targetUrl: null,
    }];
  });
