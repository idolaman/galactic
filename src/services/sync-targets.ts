import type { SyncTarget } from "@/types/sync-target";

export const normalizeSyncTargetPath = (value: string): string => {
  const normalized = value.trim().replace(/\\/g, "/").replace(/^\/+/, "");
  return normalized.replace(/\/+/g, "/");
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

export const includesSyncTarget = (list: SyncTarget[], candidate: SyncTarget): boolean => {
  return list.some((target) => isSameSyncTarget(target, candidate));
};

export const dedupeSyncTargets = (targets: SyncTarget[]): SyncTarget[] => {
  const seen = new Set<string>();
  return targets.filter((target) => {
    const key = `${target.kind}:${target.path}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
};
