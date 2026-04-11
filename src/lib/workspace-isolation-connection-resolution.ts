import { buildWorkspaceIsolationUrl } from "./workspace-isolation-routing.js";
import type {
  ResolvedWorkspaceIsolationConnection,
  WorkspaceIsolationConnection,
  WorkspaceIsolationService,
  WorkspaceIsolationStack,
} from "../types/workspace-isolation.js";

const MISSING_TARGET = {
  projectName: "Missing project",
  serviceName: "Missing target",
  workspaceLabel: "Missing workspace",
};

const findTarget = (
  workspaceIsolationStacks: WorkspaceIsolationStack[],
  connection: WorkspaceIsolationConnection,
): {
  stack: Pick<WorkspaceIsolationStack, "projectName" | "workspaceRootLabel">;
  service: Pick<WorkspaceIsolationService, "name" | "slug">;
  targetProjectName: string;
  targetName: string;
  targetWorkspaceLabel: string;
} | null => {
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
    targetName: targetService.name,
    targetProjectName: targetStack.projectName,
    targetWorkspaceLabel: targetStack.workspaceRootLabel,
  };
};

export const resolveWorkspaceIsolationConnections = (
  workspaceIsolationStacks: WorkspaceIsolationStack[],
  service: WorkspaceIsolationService,
): ResolvedWorkspaceIsolationConnection[] =>
  service.connections.flatMap<ResolvedWorkspaceIsolationConnection>((connection) => {
    const envKey = connection.envKey.trim();
    if (!envKey) {
      return [];
    }

    const target = findTarget(workspaceIsolationStacks, connection);
    if (!target) {
      return [{
        ...connection,
        envKey,
        targetName: MISSING_TARGET.serviceName,
        targetProjectName: MISSING_TARGET.projectName,
        targetWorkspaceLabel: MISSING_TARGET.workspaceLabel,
        targetUrl: null,
        isMissing: true,
      }];
    }

    return [{
      ...connection,
      envKey,
      targetName: target.targetName,
      targetProjectName: target.targetProjectName,
      targetWorkspaceLabel: target.targetWorkspaceLabel,
      targetUrl: buildWorkspaceIsolationUrl(target.stack, target.service),
      isMissing: false,
    }];
  });
