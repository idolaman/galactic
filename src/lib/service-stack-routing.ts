import type { ServiceStackEnvironment, ServiceStackService } from "../types/service-stack.js";
import {
  SERVICE_STACK_PROXY_PORT,
  normalizeRelativeServicePath,
  sanitizeRelativeServicePathInput,
  toServiceStackSlug,
} from "./service-stack-mock.js";

export const REPOSITORY_ROOT_LABEL = "Repository Root";
export const HOSTNAME_SEGMENT_MAX_LENGTH = 24;

const ROOT_BRANCH_SEGMENT = "root";
const APP_SEGMENT = "app";
const APP_DISPLAY_NAME = "App";
const HASH_LENGTH = 4;
const GENERATED_NAME_LENGTH = 5;
const GENERATED_NAME_CHARS = "abcdefghijklmnopqrstuvwxyz";

const getStableHash = (value: string): string => {
  let hash = 7;
  for (const char of value) {
    hash = (hash * 31 + char.charCodeAt(0)) | 0;
  }
  return Math.abs(hash).toString(36).slice(0, HASH_LENGTH).padStart(HASH_LENGTH, "0");
};

const limitHostnameSegment = (value: string, fallback: string, source: string): string => {
  const slug = toServiceStackSlug(value, fallback);
  if (slug.length <= HOSTNAME_SEGMENT_MAX_LENGTH) {
    return slug;
  }
  const prefixLength = HOSTNAME_SEGMENT_MAX_LENGTH - HASH_LENGTH - 1;
  return `${slug.slice(0, prefixLength)}-${getStableHash(source)}`;
};

const getUniqueHostnameSegment = (value: string, fallback: string, source: string, usedSegments: Set<string>): string => {
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

export const getServiceDisplayName = (relativePath: string): string => {
  const normalizedPath = normalizeRelativeServicePath(relativePath);
  if (normalizedPath === ".") {
    return APP_DISPLAY_NAME;
  }
  const segments = normalizedPath.split("/");
  return segments.at(-1) ?? APP_DISPLAY_NAME;
};

export const applyDerivedServiceFields = (services: ServiceStackService[]): ServiceStackService[] => {
  const usedNames = new Set<string>();
  const usedSlugs = new Set<string>();
  return services.map((service) => {
    const relativePathInput = service.relativePath.trim() === "."
      ? "."
      : sanitizeRelativeServicePathInput(service.relativePath);
    const derivedRelativePath = relativePathInput === "."
      ? "."
      : normalizeRelativeServicePath(relativePathInput);
    const baseName = getServiceDisplayName(derivedRelativePath);
    const serviceName = (() => {
      const normalizedBaseName = baseName.toLowerCase();
      if (!usedNames.has(normalizedBaseName)) {
        usedNames.add(normalizedBaseName);
        return baseName;
      }
      let attempt = 0;
      while (true) {
        const uniqueName = `${baseName}-${getGeneratedNameSuffix(`${service.id}:${derivedRelativePath}:${attempt}`)}`;
        const normalizedUniqueName = uniqueName.toLowerCase();
        if (!usedNames.has(normalizedUniqueName)) {
          usedNames.add(normalizedUniqueName);
          return uniqueName;
        }
        attempt += 1;
      }
    })();
    const slug = usedSlugs.has(limitHostnameSegment(serviceName, APP_SEGMENT, service.id))
      ? getUniqueHostnameSegment(serviceName, APP_SEGMENT, service.id, usedSlugs)
      : limitHostnameSegment(serviceName, APP_SEGMENT, service.id);
    usedSlugs.add(slug);
    return {
      ...service,
      name: serviceName,
      slug,
      relativePath: relativePathInput,
    };
  });
};

const getBranchSegment = (stack: Pick<ServiceStackEnvironment, "projectName" | "workspaceRootLabel">): string => {
  const branchLabel = stack.workspaceRootLabel === REPOSITORY_ROOT_LABEL
    ? ROOT_BRANCH_SEGMENT
    : stack.workspaceRootLabel;
  return limitHostnameSegment(
    branchLabel,
    ROOT_BRANCH_SEGMENT,
    `${stack.projectName}:${stack.workspaceRootLabel}`,
  );
};

const getProjectSegment = (stack: Pick<ServiceStackEnvironment, "projectName">): string =>
  limitHostnameSegment(stack.projectName, "project", stack.projectName);

export const buildServiceStackHostname = (stack: Pick<ServiceStackEnvironment, "projectName" | "workspaceRootLabel">, service: Pick<ServiceStackService, "slug">): string =>
  `${service.slug}.${getBranchSegment(stack)}.${getProjectSegment(stack)}.localhost`;

export const buildServiceStackUrl = (stack: Pick<ServiceStackEnvironment, "projectName" | "workspaceRootLabel">, service: Pick<ServiceStackService, "slug">): string =>
  `http://${buildServiceStackHostname(stack, service)}:${SERVICE_STACK_PROXY_PORT}`;
