import path from "node:path";
import type { SyncTarget } from "./types.js";

export const normalizeSyncTargetPath = (value: string): string => {
  return value.trim().replace(/\\/g, "/").replace(/^\/+/, "").replace(/\/+/g, "/");
};

export const normalizeRelativePath = (rootPath: string, entryPath: string): string => {
  return path.relative(rootPath, entryPath).split(path.sep).join("/");
};

export const isWithinRoot = (rootPath: string, candidatePath: string): boolean => {
  const relative = path.relative(rootPath, candidatePath);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
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
