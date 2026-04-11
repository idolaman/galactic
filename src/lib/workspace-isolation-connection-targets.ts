import { buildWorkspaceIsolationHostname } from "./workspace-isolation-routing.js";
import type {
  WorkspaceIsolationConnectionTarget,
  WorkspaceIsolationService,
  WorkspaceIsolationStack,
} from "../types/workspace-isolation.js";

const sortTargets = (
  targets: WorkspaceIsolationConnectionTarget[],
): WorkspaceIsolationConnectionTarget[] =>
  [...targets].sort((left, right) =>
    `${left.projectName}/${left.workspaceRootLabel}/${left.serviceName}`.localeCompare(
      `${right.projectName}/${right.workspaceRootLabel}/${right.serviceName}`,
    ),
  );

const toTarget = (
  source: "local" | "external",
  stack: Pick<
    WorkspaceIsolationStack,
    "id" | "projectId" | "projectName" | "workspaceRootPath" | "workspaceRootLabel"
  >,
  service: Pick<WorkspaceIsolationService, "id" | "name" | "slug">,
): WorkspaceIsolationConnectionTarget => ({
  value: `${stack.id}:${service.id}`,
  source,
  stackId: stack.id,
  serviceId: service.id,
  projectId: stack.projectId,
  projectName: stack.projectName,
  workspaceRootPath: stack.workspaceRootPath,
  workspaceRootLabel: stack.workspaceRootLabel,
  serviceName: service.name,
  hostname: buildWorkspaceIsolationHostname(stack, service),
});

export const buildWorkspaceIsolationConnectionValue = (
  stackId: string,
  serviceId: string,
): string => `${stackId}:${serviceId}`;

export const getWorkspaceIsolationConnectionTargets = ({
  currentProjectId,
  currentStackId,
  currentProjectName,
  currentWorkspaceRootPath,
  currentWorkspaceLabel,
  currentServiceId,
  currentServices,
  workspaceIsolationStacks,
}: {
  currentProjectId: string;
  currentStackId: string;
  currentProjectName: string;
  currentWorkspaceRootPath: string;
  currentWorkspaceLabel: string;
  currentServiceId: string;
  currentServices: WorkspaceIsolationService[];
  workspaceIsolationStacks: WorkspaceIsolationStack[];
}): {
  localTargets: WorkspaceIsolationConnectionTarget[];
  externalTargets: WorkspaceIsolationConnectionTarget[];
} => {
  const localStack = {
    id: currentStackId,
    projectId: currentProjectId,
    projectName: currentProjectName,
    workspaceRootPath: currentWorkspaceRootPath,
    workspaceRootLabel: currentWorkspaceLabel,
  };

  return {
    localTargets: sortTargets(
      currentServices
        .filter((service) => service.id !== currentServiceId)
        .map((service) => toTarget("local", localStack, service)),
    ),
    externalTargets: sortTargets(
      workspaceIsolationStacks
        .filter((stack) => stack.projectId !== currentProjectId)
        .flatMap((stack) =>
          stack.services.map((service) => toTarget("external", stack, service)),
        ),
    ),
  };
};
