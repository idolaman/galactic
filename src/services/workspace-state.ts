const normalizePath = (targetPath: string): string => targetPath.replace(/\/+$/, "");

const relaunchTargets = new Set<string>();
const launchedEnvironments = new Map<string, string | null>();

const RELAUNCH_STATE_CHANGED_EVENT = "galactic-workspace-relaunch-changed";

const notifyChange = (): void => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(RELAUNCH_STATE_CHANGED_EVENT));
  }
};

export const markWorkspaceRequiresRelaunch = (targetPath: string): void => {
  relaunchTargets.add(normalizePath(targetPath));
  notifyChange();
};

export const markAllWorkspacesRequireRelaunch = (workspacePaths: string[]): void => {
  for (const path of workspacePaths) {
    relaunchTargets.add(normalizePath(path));
  }
  notifyChange();
};

export const clearWorkspaceRelaunchFlag = (targetPath: string): void => {
  relaunchTargets.delete(normalizePath(targetPath));
  notifyChange();
};

export const setLaunchedEnvironment = (targetPath: string, envId: string | null): void => {
  const path = normalizePath(targetPath);
  launchedEnvironments.set(path, envId);
  relaunchTargets.delete(path);
  notifyChange();
};

export const ensureLaunchedEnvironment = (targetPath: string, envId: string | null): void => {
  const path = normalizePath(targetPath);
  if (!launchedEnvironments.has(path)) {
    launchedEnvironments.set(path, envId);
  }
};

export const workspaceNeedsRelaunch = (targetPath: string, currentEnvId: string | null): boolean => {
  const path = normalizePath(targetPath);
  if (relaunchTargets.has(path)) return true;
  const launched = launchedEnvironments.get(path);
  if (launched === undefined) return false;
  return launched !== currentEnvId;
};

export const subscribeToRelaunchChanges = (callback: () => void): (() => void) => {
  if (typeof window === "undefined") {
    return () => {};
  }
  window.addEventListener(RELAUNCH_STATE_CHANGED_EVENT, callback);
  return () => window.removeEventListener(RELAUNCH_STATE_CHANGED_EVENT, callback);
};
