import type {
  WorkspaceIsolationStack,
} from "../types/workspace-isolation.js";

export const WORKSPACE_ISOLATION_PROXY_PORT = 1355;
export const WORKSPACE_ISOLATION_SERVICE_PORT_START = 4310;

export const normalizeWorkspaceRootPath = (value: string): string =>
  value.replace(/[\\/]+$/, "");

export const sanitizeRelativeServicePathInput = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/\\/g, "/")
    .replace(/[^a-z/]+/g, "")
    .replace(/\/{2,}/g, "/");

export const normalizeRelativeServicePath = (value: string): string =>
  sanitizeRelativeServicePathInput(value)
    .replace(/^\/+/, "")
    .replace(/\/+$/, "") || ".";

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
