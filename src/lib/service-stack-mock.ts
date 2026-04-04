import type {
  ServiceStackEnvironment,
} from "../types/service-stack.js";

export const SERVICE_STACK_PROXY_PORT = 1355;
export const MOCK_SERVICE_PORT_START = 4310;

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

export const toServiceStackSlug = (
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
  stacks: ServiceStackEnvironment[],
): number[] => {
  return stacks.flatMap((stack) => stack.services.map((service) => service.port));
};

export const getNextMockServicePort = (
  stacks: ServiceStackEnvironment[],
  reservedPorts: number[] = [],
): number => {
  const usedPorts = new Set<number>([
    ...getUsedServicePorts(stacks),
    ...reservedPorts,
  ]);

  let port = MOCK_SERVICE_PORT_START;
  while (usedPorts.has(port)) {
    port += 1;
  }

  return port;
};
