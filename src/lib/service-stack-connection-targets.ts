import { buildServiceStackHostname } from "./service-stack-routing.js";
import type {
  ServiceConnectionTarget,
  ServiceStackEnvironment,
  ServiceStackService,
} from "../types/service-stack.js";

const sortTargets = (targets: ServiceConnectionTarget[]): ServiceConnectionTarget[] =>
  [...targets].sort((left, right) =>
    `${left.projectName}/${left.workspaceRootLabel}/${left.serviceName}`.localeCompare(
      `${right.projectName}/${right.workspaceRootLabel}/${right.serviceName}`,
    ),
  );

const toTarget = (
  source: "local" | "external",
  stack: Pick<
    ServiceStackEnvironment,
    "id" | "projectId" | "projectName" | "workspaceRootPath" | "workspaceRootLabel"
  >,
  service: Pick<ServiceStackService, "id" | "name" | "slug">,
): ServiceConnectionTarget => ({
  value: `${stack.id}:${service.id}`,
  source,
  stackId: stack.id,
  serviceId: service.id,
  projectId: stack.projectId,
  projectName: stack.projectName,
  workspaceRootPath: stack.workspaceRootPath,
  workspaceRootLabel: stack.workspaceRootLabel,
  serviceName: service.name,
  hostname: buildServiceStackHostname(stack, service),
});

export const buildServiceConnectionValue = (
  stackId: string,
  serviceId: string,
): string => `${stackId}:${serviceId}`;

export const getConnectedServiceTargets = ({
  currentProjectId,
  currentStackId,
  currentProjectName,
  currentWorkspaceRootPath,
  currentWorkspaceLabel,
  currentServiceId,
  currentServices,
  serviceStacks,
}: {
  currentProjectId: string;
  currentStackId: string;
  currentProjectName: string;
  currentWorkspaceRootPath: string;
  currentWorkspaceLabel: string;
  currentServiceId: string;
  currentServices: ServiceStackService[];
  serviceStacks: ServiceStackEnvironment[];
}): {
  localTargets: ServiceConnectionTarget[];
  externalTargets: ServiceConnectionTarget[];
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
      serviceStacks
        .filter((stack) => stack.projectId !== currentProjectId)
        .flatMap((stack) =>
          stack.services.map((service) => toTarget("external", stack, service)),
        ),
    ),
  };
};
