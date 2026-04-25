import type {
  WorkspaceIsolationStack,
} from "../types/workspace-isolation.js";

export const WORKSPACE_ISOLATION_PROXY_PORT = 1355;
export const WORKSPACE_ISOLATION_SERVICE_PORT_START = 4310;

export const normalizeWorkspaceRootPath = (value: string): string => {
  if (/^[\\/]+$/.test(value)) {
    return value[0] ?? value;
  }
  if (/^[A-Za-z]:[\\/]?$/.test(value)) {
    return value;
  }

  return value.replace(/[\\/]+$/, "");
};

export const sanitizeRelativeServicePathInput = (value: string): string =>
  value
    .trim()
    .replace(/\\/g, "/")
    .replace(/(^|\/)\.{1,2}(?=\/|$)/g, "")
    .replace(/[^A-Za-z0-9._/-]+/g, "")
    .replace(/\/{2,}/g, "/");

export const normalizeRelativeServicePath = (value: string): string =>
  sanitizeRelativeServicePathInput(value)
    .replace(/^\/+/, "")
    .replace(/\/+$/, "") || ".";

const getStableHash = (value: string): string => {
  let hash = 7;
  for (const char of value) {
    hash = (hash * 31 + char.charCodeAt(0)) | 0;
  }
  return Math.abs(hash).toString(36).slice(0, 6).padStart(6, "0");
};

export const getWorkspaceIsolationTopologyId = (projectId: string): string =>
  `project-${getStableHash(projectId)}`;

export const toWorkspaceIsolationSlug = (
  value: string,
  fallback = "stack",
): string => {
  const normalized = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");

  return normalized || fallback;
};

export const getUsedServicePorts = (
  stacks: WorkspaceIsolationStack[],
): number[] => {
  return stacks.flatMap((stack) => stack.services.map((service) => service.port));
};

export const getNextAvailableServicePort = (
  stacks: WorkspaceIsolationStack[],
  reservedPorts: number[] = [],
): number => {
  const usedPorts = new Set<number>([
    ...getUsedServicePorts(stacks),
    ...reservedPorts,
  ]);

  let port = WORKSPACE_ISOLATION_SERVICE_PORT_START;
  while (usedPorts.has(port)) {
    port += 1;
  }

  return port;
};
