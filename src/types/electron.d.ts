import type { CopySyncTargetsResult, SyncTarget } from "@/types/sync-target";
import type { GitFetchBranchesResult } from "@/types/git";
import type {
  CreateWorkspaceConsoleSessionInput,
  CreateWorkspaceConsoleSessionResult,
  WorkspaceConsoleActionResult,
  WorkspaceConsoleEvent,
  WorkspaceConsoleSession,
} from "@/types/workspace-console";
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

export interface WorkspaceIsolationStacksResult {
  success: boolean;
  stacks?: unknown[];
  error?: string;
}

export interface WorkspaceIsolationTopologiesResult {
  success: boolean;
  topologies?: unknown[];
  error?: string;
}

export interface CodeWorkspacePathResult {
  success: boolean;
  exists: boolean;
  workspacePath: string;
  error?: string;
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

export interface ProjectConfigFileExportInput {
  defaultFileName: string;
  payload: unknown;
}

export interface ProjectConfigFileExportResult {
  canceled: boolean;
  success?: boolean;
  filePath?: string;
  error?: string;
}

export interface ProjectConfigFileImportResult {
  canceled: boolean;
  success?: boolean;
  payload?: unknown;
  filePath?: string;
  error?: string;
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
  exportProjectConfigFile: (
    input: ProjectConfigFileExportInput
  ) => Promise<ProjectConfigFileExportResult>;
  importProjectConfigFile: () => Promise<ProjectConfigFileImportResult>;
  initialWorkspaceIsolationIntroSeen?: boolean;
  initialWorkspaceIsolationShellHookStatus?: unknown;
  getWorkspaceIsolationStacks: () => Promise<WorkspaceIsolationStacksResult>;
  getWorkspaceIsolationProjectTopologies: () => Promise<WorkspaceIsolationTopologiesResult>;
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
  setWorkspaceIsolationActiveUser: (
    userId: string
  ) => Promise<{ success: boolean; error?: string }>;
  clearWorkspaceIsolationActiveUser: () => Promise<{ success: boolean; error?: string }>;
  configureEnvironmentInterface: (
    action: "add" | "remove",
    address: string
  ) => Promise<{ success: boolean; output: string; error?: string }>;
  writeCodeWorkspace: (
    targetPath: string,
    envConfig: WorkspaceEnvConfig | null
  ) => Promise<{ success: boolean; workspacePath?: string; error?: string }>;
  getCodeWorkspacePath: (targetPath: string) => Promise<CodeWorkspacePathResult>;
  deleteCodeWorkspace: (targetPath: string) => Promise<{ success: boolean; error?: string }>;
  createWorkspaceConsoleSession: (
    input: CreateWorkspaceConsoleSessionInput
  ) => Promise<CreateWorkspaceConsoleSessionResult>;
  listWorkspaceConsoleSessions: () => Promise<WorkspaceConsoleSession[]>;
  writeWorkspaceConsoleInput: (
    sessionId: string,
    data: string
  ) => Promise<WorkspaceConsoleActionResult>;
  resizeWorkspaceConsoleSession: (
    sessionId: string,
    cols: number,
    rows: number
  ) => Promise<WorkspaceConsoleActionResult>;
  killWorkspaceConsoleSession: (sessionId: string) => Promise<WorkspaceConsoleActionResult>;
  onWorkspaceConsoleEvent: (
    callback: (event: WorkspaceConsoleEvent) => void
  ) => () => void;
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
  // Auth
  getAuthCallbackUrl: () => Promise<string>;
  consumeAuthCallbackUrl: () => Promise<string | null>;
  onAuthCallbackUrl: (callback: (url: string) => void) => () => void;
  openExternalAuthUrl: (url: string) => Promise<{ success: boolean; error?: string }>;
  getAuthStorageItem: (key: string) => Promise<string | null>;
  setAuthStorageItem: (key: string, value: string) => Promise<{ success: boolean; error?: string }>;
  removeAuthStorageItem: (key: string) => Promise<{ success: boolean; error?: string }>;
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
  trackEnvironmentCreated: (address: string) => Promise<{ success: boolean }>;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
