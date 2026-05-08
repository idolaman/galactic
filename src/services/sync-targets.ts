import type { SyncTarget } from "../types/sync-target.js";

export const normalizeSyncTargetPath = (value: string): string => {
  const normalized = value.trim().replace(/\\/g, "/").replace(/^\/+/, "");
  return normalized.replace(/\/+/g, "/").replace(/\/+$/, "");
};

export const isSyncTargetKind = (value: unknown): value is SyncTarget["kind"] => {
  return value === "file" || value === "directory";
};

export const sanitizeSyncTarget = (target: Partial<SyncTarget> | null | undefined): SyncTarget | null => {
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

export const toFileSyncTargets = (paths: string[] | undefined): SyncTarget[] => {
  if (!Array.isArray(paths)) {
    return [];
  }

  return paths
    .map((path) => sanitizeSyncTarget({ path, kind: "file" }))
    .filter((target): target is SyncTarget => Boolean(target));
};

export const isSameSyncTarget = (left: SyncTarget, right: SyncTarget): boolean => {
  return left.path === right.path && left.kind === right.kind;
};

const isPathWithinTarget = (targetPath: string, candidatePath: string): boolean => {
  return targetPath === candidatePath || candidatePath.startsWith(`${targetPath}/`);
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

export const includesSyncTarget = (list: SyncTarget[], candidate: SyncTarget): boolean => {
  return list.some((target) => isSameSyncTarget(target, candidate));
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
    if (coveredByExistingTarget || includesSyncTarget(normalizedTargets, target)) {
      continue;
    }

    normalizedTargets.push(target);
  }

  return normalizedTargets;
};
