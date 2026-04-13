import {
  REPOSITORY_ROOT_LABEL,
  buildWorkspaceIsolationHostname,
} from "./workspace-isolation-routing.js";
import { WORKSPACE_ISOLATION_PROXY_PORT } from "./workspace-isolation-helpers.js";
import type {
  ResolvedWorkspaceIsolationConnection,
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

export const getWorkspaceIsolationRunHint = (
  service: Pick<WorkspaceIsolationService, "relativePath">,
): string =>
  service.relativePath === "."
    ? "npm run dev"
    : `cd ${service.relativePath} && npm run dev`;

export const getWorkspaceIsolationServicePathLabel = (
  service: Pick<WorkspaceIsolationService, "relativePath">,
): string => {
  if (service.relativePath === ".") {
    return "Workspace root";
  }

  return service.relativePath;
};

export const getWorkspaceIsolationConnectionLabel = (
  stack: Pick<WorkspaceIsolationStack, "projectName" | "workspaceRootLabel">,
  connection: Pick<
    ResolvedWorkspaceIsolationConnection,
    "isMissing" | "targetName" | "targetProjectName" | "targetWorkspaceLabel"
  >,
): string => {
  if (connection.isMissing) {
    return "Missing target";
  }

  const isCurrentWorkspace =
    stack.projectName === connection.targetProjectName &&
    stack.workspaceRootLabel === connection.targetWorkspaceLabel;

  return isCurrentWorkspace
    ? connection.targetName
    : `${connection.targetProjectName} / ${connection.targetWorkspaceLabel} / ${connection.targetName}`;
};
