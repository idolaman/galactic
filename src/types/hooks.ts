export type HookPlatform = "Claude" | "VSCode" | "Cursor";
export type HookInstallMode = "automatic" | "manual";

export interface HookPlatformStatus {
  platform: HookPlatform;
  supported: boolean;
  available: boolean;
  installed: boolean;
  mode: HookInstallMode;
  requiresManual: boolean;
  summary: string;
  reason?: string;
  manualSteps?: string[];
}

export interface HookInstallResult {
  success: boolean;
  platform: HookPlatform;
  installed: boolean;
  mode: HookInstallMode;
  warnings?: string[];
  error?: string;
  manualSteps?: string[];
}
