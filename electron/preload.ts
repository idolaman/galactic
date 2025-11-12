import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  ping: () => ipcRenderer.invoke("ping"),
  checkEditorInstalled: (editorName: string) => ipcRenderer.invoke("check-editor-installed", editorName),
});

