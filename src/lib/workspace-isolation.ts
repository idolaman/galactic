import {
  REPOSITORY_ROOT_LABEL,
  buildWorkspaceIsolationHostname,
} from "./workspace-isolation-routing.js";
import { WORKSPACE_ISOLATION_PROXY_PORT } from "./workspace-isolation-helpers.js";
import type {
  WorkspaceIsolationService,
  WorkspaceIsolationStack,
} from "../types/workspace-isolation.js";

export const getWorkspaceIsolationName = (
  projectName: string,
  workspaceRootLabel: string,
): string =>
  workspaceRootLabel === REPOSITORY_ROOT_LABEL
    ? projectName
    : workspaceRootLabel;

export const getWorkspaceIsolationPreviewRoutes = (
  stack: WorkspaceIsolationStack,
  limit = 2,
): string[] =>
  stack.services.slice(0, limit).map((service) =>
    getWorkspaceIsolationRouteDomain(stack, service),
  );

export const getWorkspaceIsolationRouteDomain = (
  stack: Pick<WorkspaceIsolationStack, "projectName" | "workspaceRootLabel">,
  service: Pick<WorkspaceIsolationService, "slug">,
): string =>
  `${buildWorkspaceIsolationHostname(stack, service)}:${WORKSPACE_ISOLATION_PROXY_PORT}`;

export const getWorkspaceIsolationRouteSummary = (
  stack: Pick<WorkspaceIsolationStack, "projectName" | "workspaceRootLabel">,
  service: Pick<WorkspaceIsolationService, "slug" | "port">,
): string =>
  `${getWorkspaceIsolationRouteDomain(stack, service)} -> localhost:${service.port}`;

export const getWorkspaceIsolationServicePathLabel = (
  service: Pick<WorkspaceIsolationService, "relativePath">,
): string => {
  if (service.relativePath === ".") {
    return "Workspace root";
  }

  return service.relativePath;
};
