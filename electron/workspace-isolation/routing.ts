import type {
  SaveWorkspaceIsolationInput,
  WorkspaceIsolationConnection,
  WorkspaceIsolationService,
  WorkspaceIsolationStack,
} from "./types.js";

const HOSTNAME_SEGMENT_MAX_LENGTH = 24;
const HASH_LENGTH = 4;
const APP_DISPLAY_NAME = "App";
const GENERATED_NAME_LENGTH = 5;
const GENERATED_NAME_CHARS = "abcdefghijklmnopqrstuvwxyz";
export const REPOSITORY_ROOT_LABEL = "Repository Root";
const ROOT_BRANCH_SEGMENT = "root";

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
  value.trim().replace(/\\/g, "/").replace(/(^|\/)\.{1,2}(?=\/|$)/g, "").replace(/[^A-Za-z0-9._/-]+/g, "").replace(/\/{2,}/g, "/");

export const normalizeRelativeServicePath = (value: string): string =>
  sanitizeRelativeServicePathInput(value).replace(/^\/+/, "").replace(/\/+$/, "") || ".";

export const toSlug = (value: string, fallback: string): string => {
  const normalized = value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").replace(/-{2,}/g, "-");
  return normalized || fallback;
};

const getStableHash = (value: string): string => {
  let hash = 7;
  for (const char of value) {
    hash = (hash * 31 + char.charCodeAt(0)) | 0;
  }
  return Math.abs(hash).toString(36).slice(0, HASH_LENGTH).padStart(HASH_LENGTH, "0");
};

const limitHostnameSegment = (value: string, fallback: string, source: string): string => {
  const slug = toSlug(value, fallback);
  if (slug.length <= HOSTNAME_SEGMENT_MAX_LENGTH) {
    return slug;
  }
  const prefixLength = HOSTNAME_SEGMENT_MAX_LENGTH - HASH_LENGTH - 1;
  return `${slug.slice(0, prefixLength)}-${getStableHash(source)}`;
};

const getUniqueHostnameSegment = (
  value: string,
  fallback: string,
  source: string,
  usedSegments: Set<string>,
): string => {
  const baseSegment = limitHostnameSegment(value, fallback, source);
  if (!usedSegments.has(baseSegment)) {
    usedSegments.add(baseSegment);
    return baseSegment;
  }
  const prefixLength = HOSTNAME_SEGMENT_MAX_LENGTH - HASH_LENGTH - 1;
  let attempt = 1;
  while (true) {
    const uniqueSegment = `${baseSegment.slice(0, prefixLength)}-${getStableHash(`${source}:${attempt}`)}`;
    if (!usedSegments.has(uniqueSegment)) {
      usedSegments.add(uniqueSegment);
      return uniqueSegment;
    }
    attempt += 1;
  }
};

const getGeneratedNameSuffix = (value: string): string => {
  let seed = 11;
  for (const char of value) {
    seed = (seed * 31 + char.charCodeAt(0)) >>> 0;
  }
  let suffix = "";
  for (let index = 0; index < GENERATED_NAME_LENGTH; index += 1) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    suffix += GENERATED_NAME_CHARS[seed % GENERATED_NAME_CHARS.length];
  }
  return suffix;
};

const getServiceDisplayName = (relativePath: string): string => {
  if (relativePath === ".") {
    return APP_DISPLAY_NAME;
  }
  const segments = relativePath.split("/");
  return segments.at(-1) ?? APP_DISPLAY_NAME;
};

const normalizeConnections = (connections: WorkspaceIsolationConnection[]): WorkspaceIsolationConnection[] =>
  connections.flatMap((connection) => {
    const envKey = connection.envKey.trim();
    if (!envKey || !connection.targetStackId || !connection.targetServiceId) {
      return [];
    }
    return [{ ...connection, envKey }];
  });

export const applyDerivedServiceFields = (services: WorkspaceIsolationService[]): WorkspaceIsolationService[] => {
  const usedNames = new Set<string>();
  const usedSlugs = new Set<string>();
  return services.map((service) => {
    const relativePath = service.relativePath === "." ? "." : normalizeRelativeServicePath(service.relativePath);
    const baseName = getServiceDisplayName(relativePath);
    const normalizedBaseName = baseName.toLowerCase();
    let name = baseName;
    if (usedNames.has(normalizedBaseName)) {
      let attempt = 0;
      while (true) {
        const candidate = `${baseName}-${getGeneratedNameSuffix(`${service.id}:${relativePath}:${attempt}`)}`;
        if (!usedNames.has(candidate.toLowerCase())) {
          name = candidate;
          break;
        }
        attempt += 1;
      }
    }
    usedNames.add(name.toLowerCase());
    const slug = usedSlugs.has(limitHostnameSegment(name, "app", service.id))
      ? getUniqueHostnameSegment(name, "app", service.id, usedSlugs)
      : limitHostnameSegment(name, "app", service.id);
    usedSlugs.add(slug);
    return { ...service, name, slug, relativePath, connections: normalizeConnections(service.connections) };
  });
};

const getWorkspaceSegment = (stack: Pick<WorkspaceIsolationStack, "projectName" | "workspaceRootLabel">): string => {
  const label = stack.workspaceRootLabel === REPOSITORY_ROOT_LABEL ? ROOT_BRANCH_SEGMENT : stack.workspaceRootLabel;
  return limitHostnameSegment(label, ROOT_BRANCH_SEGMENT, `${stack.projectName}:${stack.workspaceRootLabel}`);
};

const getProjectSegment = (stack: Pick<WorkspaceIsolationStack, "projectName">): string =>
  limitHostnameSegment(stack.projectName, "project", stack.projectName);

export const buildWorkspaceIsolationHostname = (
  stack: Pick<WorkspaceIsolationStack, "projectName" | "workspaceRootLabel">,
  service: Pick<WorkspaceIsolationService, "slug">,
): string => `${service.slug}.${getWorkspaceSegment(stack)}.${getProjectSegment(stack)}.localhost`;

export const buildWorkspaceIsolationUrl = (
  stack: Pick<WorkspaceIsolationStack, "projectName" | "workspaceRootLabel">,
  service: Pick<WorkspaceIsolationService, "slug">,
): string =>
  `http://${buildWorkspaceIsolationHostname(stack, service)}:${WORKSPACE_ISOLATION_PROXY_PORT}`;

export const buildStoredStack = (
  input: SaveWorkspaceIsolationInput,
  id: string,
  services: WorkspaceIsolationService[],
  createdAt: number,
): WorkspaceIsolationStack => ({
  id,
  kind: "workspace-isolation",
  name: input.name.trim(),
  slug: toSlug(input.name, "stack"),
  projectId: input.projectId,
  workspaceRootPath: normalizeWorkspaceRootPath(input.workspaceRootPath),
  workspaceRootLabel: input.workspaceRootLabel,
  projectName: input.projectName,
  workspaceMode: input.workspaceMode,
  createdAt,
  services: applyDerivedServiceFields(services),
});
