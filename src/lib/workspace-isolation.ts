import {
  REPOSITORY_ROOT_LABEL,
  buildServiceStackHostname,
} from "./service-stack-routing.js";
import type {
  ServiceStackEnvironment,
  ServiceStackService,
} from "../types/service-stack.js";

export const getWorkspaceIsolationName = (
  projectName: string,
  workspaceRootLabel: string,
): string =>
  workspaceRootLabel === REPOSITORY_ROOT_LABEL
    ? projectName
    : workspaceRootLabel;

export const getWorkspaceIsolationHostnames = (
  stack: ServiceStackEnvironment,
  limit = 2,
): string[] =>
  stack.services
    .slice(0, limit)
    .map((service) => buildServiceStackHostname(stack, service));

export const getWorkspaceIsolationRouteSummary = (
  stack: Pick<ServiceStackEnvironment, "projectName" | "workspaceRootLabel">,
  service: Pick<ServiceStackService, "slug" | "port">,
): string =>
  `${buildServiceStackHostname(stack, service)} -> localhost:${service.port}`;

export const getWorkspaceIsolationServicePathLabel = (
  service: Pick<ServiceStackService, "relativePath">,
): string => {
  if (service.relativePath === ".") {
    return "Workspace root";
  }

  return service.relativePath;
};
