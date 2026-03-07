export const hookPlatforms = ["Claude", "VSCode", "Cursor"] as const;

export type HookPlatform = (typeof hookPlatforms)[number];
export type HookInstallMode = "automatic" | "manual";

export interface HookSessionSummary {
  id: string;
  title: string;
  started_at?: string;
  ended_at?: string;
  platform?: string;
  git_branch?: string;
  approval_pending_since?: string;
  workspace_path?: string;
  chat_id?: string;
  estimated_duration?: number;
  status: "in_progress" | "done";
}

export type GalacticHookEvent =
  | {
      type: "session.started";
      sessionId: string;
      chatId: string;
      title?: string;
      workspacePath?: string;
      platform: string;
      startedAt: string;
      gitBranch?: string;
      estimatedDuration?: number;
    }
  | { type: "approval.pending"; sessionId: string; at: string }
  | { type: "approval.cleared"; sessionId: string; at: string }
  | {
      type: "session.finished";
      sessionId: string;
      endedAt: string;
      status: "ok" | "cancelled" | "error";
      error?: string;
    };

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

export interface HookInstallRecord {
  installedAt: string;
  mode: HookInstallMode;
  reference?: string;
}

export interface HookInstallManifest {
  version: 1;
  installs: Partial<Record<HookPlatform, HookInstallRecord>>;
}
