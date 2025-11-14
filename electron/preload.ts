import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  ping: () => ipcRenderer.invoke("ping"),
  checkEditorInstalled: (editorName: string) =>
    ipcRenderer.invoke("check-editor-installed", editorName),
  chooseProjectDirectory: () => ipcRenderer.invoke("os/choose-project-directory"),
  getGitInfo: (projectPath: string) => ipcRenderer.invoke("git/get-info", projectPath),
  openProjectInEditor: (editorName: string, projectPath: string) =>
    ipcRenderer.invoke("editor/open-project", editorName, projectPath),
});
