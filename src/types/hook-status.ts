export type HookId = "claude";
export type HookInstallStatus = "installed" | "not-installed" | "update-available";
export type HookStatusMap = Record<HookId, HookInstallStatus>;

export const DEFAULT_HOOK_STATUSES: HookStatusMap = {
  claude: "not-installed",
};
