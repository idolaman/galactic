import { contextBridge, ipcRenderer } from "electron";

const initialSessionCache = ipcRenderer.sendSync("session/get-cache-sync");
const initialDismissedSessions = ipcRenderer.sendSync("session/get-dismissed-sync");

contextBridge.exposeInMainWorld("electronAPI", {
  ping: () => ipcRenderer.invoke("ping"),
  getAppVersion: () => ipcRenderer.invoke("app/get-version"),
  checkEditorInstalled: (editorName: string) =>
    ipcRenderer.invoke("check-editor-installed", editorName),
  chooseProjectDirectory: () => ipcRenderer.invoke("os/choose-project-directory"),
  getGitInfo: (projectPath: string) => ipcRenderer.invoke("git/get-info", projectPath),
  listGitBranches: (projectPath: string) => ipcRenderer.invoke("git/list-branches", projectPath),
  getGitWorktrees: (projectPath: string) => ipcRenderer.invoke("git/get-worktrees", projectPath),
  fetchGitBranches: (projectPath: string) => ipcRenderer.invoke("git/fetch-branches", projectPath),
  createGitWorktree: (projectPath: string, branch: string) =>
    ipcRenderer.invoke("git/create-worktree", projectPath, branch),
  removeGitWorktree: (projectPath: string, workspacePath: string) =>
    ipcRenderer.invoke("git/remove-worktree", projectPath, workspacePath),
  openProjectInEditor: (editorName: string, projectPath: string) =>
    ipcRenderer.invoke("editor/open-project", editorName, projectPath),
  searchProjectSyncTargets: (projectPath: string, query: string) =>
    ipcRenderer.invoke("project/search-sync-targets", projectPath, query),
  copyProjectSyncTargetsToWorktree: (
    projectPath: string,
    worktreePath: string,
    targets: Array<{ path: string; kind: "file" | "directory" }>,
  ) => ipcRenderer.invoke("project/copy-sync-targets-to-worktree", projectPath, worktreePath, targets),
  configureEnvironmentInterface: (action: "add" | "remove", address: string) =>
    ipcRenderer.invoke("network/configure-environment-interface", action, address),
  writeCodeWorkspace: (
    targetPath: string,
    envConfig: { address?: string; envVars?: Record<string, string> } | null,
  ) => ipcRenderer.invoke("workspace/write-code-workspace", targetPath, envConfig),
  getCodeWorkspacePath: (targetPath: string) =>
    ipcRenderer.invoke("workspace/get-code-workspace-path", targetPath),
  deleteCodeWorkspace: (targetPath: string) =>
    ipcRenderer.invoke("workspace/delete-code-workspace", targetPath),
  checkMcpInstalled: (tool: string) => ipcRenderer.invoke("mcp/check-installed", tool),
  installMcp: (tool: string) => ipcRenderer.invoke("mcp/install", tool),
  getMcpServerStatus: () => ipcRenderer.invoke("mcp/server-status"),
  restartMcpServer: () => ipcRenderer.invoke("mcp/restart-server"),
  toggleQuickSidebar: () => ipcRenderer.invoke("quick-sidebar/toggle"),
  hideQuickSidebar: () => ipcRenderer.invoke("quick-sidebar/hide"),
  getQuickSidebarHotkeyEnabled: () => ipcRenderer.invoke("settings/get-quick-sidebar-hotkey"),
  setQuickSidebarHotkeyEnabled: (enabled: boolean) =>
    ipcRenderer.invoke("settings/set-quick-sidebar-hotkey", enabled),
  checkForUpdates: () => ipcRenderer.invoke("update/check"),
  applyUpdate: () => ipcRenderer.invoke("update/apply"),
  onUpdateEvent: (
    callback: (status: string, payload: Record<string, unknown>) => void,
  ) => {
    const handler = (_event: Electron.IpcRendererEvent, status: string, payload: Record<string, unknown>) => {
      callback(status, payload);
    };
    ipcRenderer.on("update/event", handler);
    return () => ipcRenderer.removeListener("update/event", handler);
  },
  // Session sync between windows
  initialSessionCache: Array.isArray(initialSessionCache) ? initialSessionCache : [],
  initialDismissedSessions: Array.isArray(initialDismissedSessions) ? initialDismissedSessions : [],
  getCachedSessions: () => ipcRenderer.invoke("session/get-cache"),
  getDismissedSessions: () => ipcRenderer.invoke("session/get-dismissed"),
  setCachedSessions: (sessions: unknown[]) => ipcRenderer.invoke("session/set-cache", sessions),
  broadcastSessionDismiss: (sessionId: string, signature: string) =>
    ipcRenderer.invoke("session/broadcast-dismiss", sessionId, signature),
  onSessionDismissed: (callback: (sessionId: string, signature: string) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, sessionId: string, signature: string) => {
      callback(sessionId, signature);
    };
    ipcRenderer.on("session/dismissed", handler);
    return () => ipcRenderer.removeListener("session/dismissed", handler);
  },
  trackAnalyticsEvent: (event: string, payload?: Record<string, string | number | boolean>) =>
    ipcRenderer.invoke("analytics/track-event", event, payload),
  // Analytics
  trackEnvironmentCreated: (address: string) =>
    ipcRenderer.invoke("analytics/track-environment-created", address),
});
