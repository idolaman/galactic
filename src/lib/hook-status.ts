import type { HookInstallStatus, HookStatusMap } from "../types/hook-status.js";

const hookActionLabels: Record<HookInstallStatus, string> = {
  installed: "Installed",
  "not-installed": "Install",
  "update-available": "Update",
};

const hookProgressLabels: Record<HookInstallStatus, string> = {
  installed: "Installing...",
  "not-installed": "Installing...",
  "update-available": "Updating...",
};

export const getHookActionLabel = (status: HookInstallStatus, isInstalling: boolean): string => {
  return isInstalling ? hookProgressLabels[status] : hookActionLabels[status];
};

export const hasHookUpdates = (statuses: HookStatusMap): boolean => {
  return Object.values(statuses).some((status) => status === "update-available");
};

export const isHookActionDisabled = (status: HookInstallStatus, isInstalling: boolean): boolean => {
  return isInstalling || status === "installed";
};
