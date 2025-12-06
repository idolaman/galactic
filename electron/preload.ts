import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  ping: () => ipcRenderer.invoke("ping"),
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
  searchProjectFiles: (projectPath: string, query: string) =>
    ipcRenderer.invoke("project/search-files", projectPath, query),
  copyProjectFilesToWorktree: (projectPath: string, worktreePath: string, files: string[]) =>
    ipcRenderer.invoke("project/copy-files-to-worktree", projectPath, worktreePath, files),
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
});
