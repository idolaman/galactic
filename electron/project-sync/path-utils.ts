import path from "node:path";
import type { SyncTarget } from "./types.js";

export const normalizeSyncTargetPath = (value: string): string => {
  return value
    .trim()
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/\/+/g, "/")
    .replace(/\/+$/, "");
};

export const normalizeRelativePath = (rootPath: string, entryPath: string): string => {
  return path.relative(rootPath, entryPath).split(path.sep).join("/");
};

export const isWithinRoot = (rootPath: string, candidatePath: string): boolean => {
  const relative = path.relative(rootPath, candidatePath);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
};

export const isPathWithinTarget = (targetPath: string, candidatePath: string): boolean => {
  return targetPath === candidatePath || candidatePath.startsWith(`${targetPath}/`);
};

export const isSyncTargetKind = (value: unknown): value is SyncTarget["kind"] => {
  return value === "file" || value === "directory";
};

export const sanitizeSyncTarget = (
  target: Partial<SyncTarget> | null | undefined,
): SyncTarget | null => {
  if (!target || typeof target.path !== "string" || !isSyncTargetKind(target.kind)) {
    return null;
  }

  const normalizedPath = normalizeSyncTargetPath(target.path);
  if (!normalizedPath) {
    return null;
  }

  return {
    path: normalizedPath,
    kind: target.kind,
  };
};

const compareSyncTargets = (left: SyncTarget, right: SyncTarget): number => {
  const depthDifference = left.path.split("/").length - right.path.split("/").length;
  if (depthDifference !== 0) {
    return depthDifference;
  }

  if (left.kind !== right.kind) {
    return left.kind === "directory" ? -1 : 1;
  }

  return left.path.localeCompare(right.path);
};

export const normalizeSyncTargets = (targets: SyncTarget[]): SyncTarget[] => {
  const cleanedTargets = targets
    .map((target) => sanitizeSyncTarget(target))
    .filter((target): target is SyncTarget => Boolean(target))
    .sort(compareSyncTargets);
  const normalizedTargets: SyncTarget[] = [];

  for (const target of cleanedTargets) {
    const coveredByExistingTarget = normalizedTargets.some((existingTarget) => {
      return existingTarget.kind === "directory" && isPathWithinTarget(existingTarget.path, target.path);
    });
    if (coveredByExistingTarget) {
      continue;
    }

    const alreadyIncluded = normalizedTargets.some((existingTarget) => {
      return existingTarget.path === target.path && existingTarget.kind === target.kind;
    });
    if (alreadyIncluded) {
      continue;
    }

    normalizedTargets.push(target);
  }

  return normalizedTargets;
};
