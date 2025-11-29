const normalizePath = (targetPath: string): string => targetPath.replace(/\/+$/, "");

const relaunchTargets = new Set<string>();

export const markWorkspaceRequiresRelaunch = (targetPath: string): void => {
  relaunchTargets.add(normalizePath(targetPath));
};

export const clearWorkspaceRelaunchFlag = (targetPath: string): void => {
  relaunchTargets.delete(normalizePath(targetPath));
};

export const workspaceNeedsRelaunch = (targetPath: string): boolean => {
  return relaunchTargets.has(normalizePath(targetPath));
};