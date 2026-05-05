import type { CopySyncTargetsResult, SyncTarget } from "@/types/sync-target";
import type { GitFetchBranchesResult } from "@/types/git";
import type { AnalyticsEvent } from "@/types/analytics";

export interface GitInfo {
  isGitRepo: boolean;
}

export interface WorktreeResult {
  success: boolean;
  path?: string;
  error?: string;
  alreadyRemoved?: boolean;
}

export interface CreateWorktreeOptions {
  createBranch?: boolean;
  startPoint?: string;
}

export interface GitBranchListOptions {
  scope?: "all" | "local";
}

export interface GitWorktreeInfo {
  path: string;
  branch: string;
  sha: string;
}

export interface WorkspaceEnvConfig {
  address?: string;
  envVars?: Record<string, string>;
}

export type PreferredEditorName = "Cursor" | "VSCode";

export interface ToggleSettingResult {
  success: boolean;
  enabled: boolean;
  error?: string;
}

export type EventNotificationAuthorizationStatus =
  | "authorized"
  | "denied"
  | "not-determined"
  | "unsupported";

export interface EventNotificationStatus {
  authorizationStatus: EventNotificationAuthorizationStatus;
  enabled: boolean;
  message?: string;
  supported: boolean;
}

export interface WorkspaceIsolationShellHookStatus {
  enabled: boolean;
  supported: boolean;
  installed: boolean;
  hookPath: string | null;
  zshrcPath: string | null;
  message?: string;
}

export interface WorkspaceIsolationProxyStatus {
  running: boolean;
  port: number;
  message?: string;
}

export interface OpenProjectInEditorResult {
  success: boolean;
  error?: string;
  usedEditor?: PreferredEditorName;
  fallbackApplied?: boolean;
}

export interface SessionCacheSnapshot {
  sessions: unknown[];
  preferredEditor: PreferredEditorName;
}

export interface PostHogSessionRecordingConfig {
  enabled: boolean;
  host: string;
  projectKey: string;
}

export interface ElectronAPI {
  ping: () => Promise<string>;
  getAppVersion: () => Promise<string>;
  checkEditorInstalled: (editorName: string) => Promise<boolean>;
  chooseProjectDirectory: () => Promise<string | null>;
  getGitInfo: (projectPath: string) => Promise<GitInfo>;
  listGitBranches: (projectPath: string, options?: GitBranchListOptions) => Promise<string[]>;
  getGitWorktrees: (projectPath: string) => Promise<GitWorktreeInfo[]>;
  fetchGitBranches: (projectPath: string) => Promise<GitFetchBranchesResult>;
  createGitWorktree: (
    projectPath: string,
    branch: string,
    options?: CreateWorktreeOptions
  ) => Promise<WorktreeResult>;
  removeGitWorktree: (projectPath: string, workspacePath: string) => Promise<WorktreeResult>;
  openProjectInEditor: (editorName: string, projectPath: string) => Promise<OpenProjectInEditorResult>;
  searchProjectSyncTargets: (projectPath: string, query: string) => Promise<SyncTarget[]>;
  copyProjectSyncTargetsToWorktree: (
    projectPath: string,
    worktreePath: string,
    targets: SyncTarget[]
  ) => Promise<CopySyncTargetsResult>;
  initialWorkspaceIsolationStacks?: unknown[];
  initialWorkspaceIsolationProjectTopologies?: unknown[];
  initialWorkspaceIsolationIntroSeen?: boolean;
  initialWorkspaceIsolationShellHookStatus?: unknown;
  getWorkspaceIsolationStacks: () => Promise<unknown[]>;
  getWorkspaceIsolationProjectTopologies: () => Promise<unknown[]>;
  saveWorkspaceIsolationProjectTopology: (
    input: unknown
  ) => Promise<{ success: boolean; error?: string; topology?: unknown }>;
  deleteWorkspaceIsolationProjectTopology: (
    topologyId: string
  ) => Promise<{ success: boolean; error?: string }>;
  enableWorkspaceIsolationForWorkspace: (
    input: unknown
  ) => Promise<{ success: boolean; error?: string; stack?: unknown }>;
  disableWorkspaceIsolationForWorkspace: (
    workspaceRootPath: string
  ) => Promise<{ success: boolean; error?: string }>;
  markWorkspaceIsolationIntroSeen: () => Promise<{ success: boolean; seen: boolean; error?: string }>;
  getWorkspaceIsolationProxyStatus: () => Promise<WorkspaceIsolationProxyStatus>;
  configureEnvironmentInterface: (
    action: "add" | "remove",
    address: string
  ) => Promise<{ success: boolean; output: string; error?: string }>;
  writeCodeWorkspace: (
    targetPath: string,
    envConfig: WorkspaceEnvConfig | null
  ) => Promise<{ success: boolean; workspacePath?: string; error?: string }>;
  getCodeWorkspacePath: (targetPath: string) => Promise<{ exists: boolean; workspacePath: string }>;
  deleteCodeWorkspace: (targetPath: string) => Promise<{ success: boolean; error?: string }>;
  checkMcpInstalled: (tool: string) => Promise<boolean>;
  installMcp: (tool: string) => Promise<{ success: boolean; error?: string }>;
  getMcpServerStatus: () => Promise<{ running: boolean; url: string; port: number }>;
  restartMcpServer: () => Promise<{ success: boolean }>;
  toggleQuickSidebar: () => Promise<{ visible: boolean }>;
  hideQuickSidebar: () => Promise<{ hidden: boolean }>;
  getQuickSidebarHotkeyEnabled: () => Promise<boolean>;
  setQuickSidebarHotkeyEnabled: (enabled: boolean) => Promise<ToggleSettingResult>;
  getWorkspaceIsolationShellHookStatus: () => Promise<WorkspaceIsolationShellHookStatus>;
  setWorkspaceIsolationShellHooksEnabled: (enabled: boolean) => Promise<ToggleSettingResult>;
  getEventNotificationStatus: () => Promise<EventNotificationStatus>;
  setEventNotificationsEnabled: (enabled: boolean) => Promise<ToggleSettingResult>;
  checkForUpdates: () => Promise<{ supported: boolean; updateAvailable?: boolean; version?: string | null; message?: string; error?: string }>;
  applyUpdate: () => Promise<{ success: boolean; error?: string }>;
  onUpdateEvent: (
    callback: (status: string, payload: Record<string, unknown>) => void
  ) => () => void;
  // Session sync between windows
  initialSessionCache?: unknown[];
  initialDismissedSessions?: Array<[string, string]>;
  getCachedSessions: () => Promise<unknown[]>;
  getDismissedSessions: () => Promise<Array<[string, string]>>;
  setCachedSessions: (snapshot: SessionCacheSnapshot) => Promise<{ success: boolean }>;
  broadcastSessionDismiss: (sessionId: string, signature: string) => Promise<{ success: boolean }>;
  onSessionDismissed: (callback: (sessionId: string, signature: string) => void) => () => void;
  // Analytics
  trackAnalyticsEvent: (
    event: AnalyticsEvent,
    payload?: Record<string, string | number | boolean>
  ) => Promise<{ success: boolean }>;
  getPostHogSessionRecordingConfig: () => Promise<PostHogSessionRecordingConfig>;
  trackEnvironmentCreated: (address: string) => Promise<{ success: boolean }>;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
