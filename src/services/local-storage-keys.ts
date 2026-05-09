export const USER_SCOPED_LOCAL_STORAGE_DATASETS = [
  "projects",
  "environments",
] as const;

export const GLOBAL_LOCAL_STORAGE_KEYS = {
  preferredEditor: "preferredEditor",
  theme: "galactic-ide-theme",
  updateToastDismissed: "galactic-ide:update-toast-dismissed",
} as const;

export const AUTH_STORAGE_KEYS = {
  pendingState: "galactic-ide:auth:pending-state",
} as const;
