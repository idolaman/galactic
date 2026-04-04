import { buildServiceStackUrl } from "./service-stack-routing.js";
import type {
  ResolvedServiceStackConnection,
  ServiceStackConnection,
  ServiceStackEnvironment,
  ServiceStackService,
} from "../types/service-stack.js";

const MISSING_TARGET = {
  projectName: "Missing project",
  serviceName: "Missing target",
  workspaceLabel: "Missing workspace",
};

const findTarget = (
  serviceStacks: ServiceStackEnvironment[],
  connection: ServiceStackConnection,
): {
  stack: Pick<ServiceStackEnvironment, "projectName" | "workspaceRootLabel">;
  service: Pick<ServiceStackService, "name" | "slug">;
  targetProjectName: string;
  targetName: string;
  targetWorkspaceLabel: string;
} | null => {
  const targetStack = serviceStacks.find((stack) => stack.id === connection.targetStackId);
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

export const resolveServiceStackConnections = (
  serviceStacks: ServiceStackEnvironment[],
  service: ServiceStackService,
): ResolvedServiceStackConnection[] =>
  service.connections.flatMap<ResolvedServiceStackConnection>((connection) => {
    const envKey = connection.envKey.trim();
    if (!envKey) {
      return [];
    }

    const target = findTarget(serviceStacks, connection);
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
      targetUrl: buildServiceStackUrl(target.stack, target.service),
      isMissing: false,
    }];
  });
