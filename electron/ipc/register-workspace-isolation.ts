import type { IpcMain } from "electron";
import type {
  EnableWorkspaceIsolationInput,
  WorkspaceIsolationProxyStatus,
  SaveWorkspaceIsolationInput,
  WorkspaceIsolationShellHookStatus,
  WorkspaceIsolationProjectTopology,
  WorkspaceIsolationStack,
} from "../workspace-isolation/types.js";

interface WorkspaceIsolationIpcDeps {
  ipcMain: Pick<IpcMain, "handle" | "on">;
  getStacks: () => WorkspaceIsolationStack[];
  getProjectTopologies: () => WorkspaceIsolationProjectTopology[];
  getIntroSeen: () => boolean;
  saveProjectTopology: (input: SaveWorkspaceIsolationInput) => Promise<{ success: boolean; error?: string; topology?: WorkspaceIsolationProjectTopology }>;
  deleteProjectTopology: (topologyId: string) => Promise<{ success: boolean; error?: string }>;
  enableWorkspace: (input: EnableWorkspaceIsolationInput) => Promise<{ success: boolean; error?: string; stack?: WorkspaceIsolationStack }>;
  disableWorkspace: (workspaceRootPath: string) => Promise<{ success: boolean; error?: string }>;
  getShellHookStatus: () => WorkspaceIsolationShellHookStatus;
  getProxyStatus: () => WorkspaceIsolationProxyStatus;
  markIntroSeen: () => Promise<boolean>;
  setShellHooksEnabled: (enabled: boolean) => Promise<WorkspaceIsolationShellHookStatus>;
}

export const registerWorkspaceIsolationIpc = ({
  ipcMain,
  getStacks,
  getProjectTopologies,
  getIntroSeen,
  saveProjectTopology,
  deleteProjectTopology,
  enableWorkspace,
  disableWorkspace,
  getShellHookStatus,
  getProxyStatus,
  markIntroSeen,
  setShellHooksEnabled,
}: WorkspaceIsolationIpcDeps): void => {
  ipcMain.on("workspace-isolation/get-sync", (event) => {
    event.returnValue = getStacks();
  });
  ipcMain.on("workspace-isolation/get-topologies-sync", (event) => {
    event.returnValue = getProjectTopologies();
  });
  ipcMain.on("workspace-isolation/get-intro-seen-sync", (event) => {
    event.returnValue = getIntroSeen();
  });
  ipcMain.on("workspace-isolation/get-shell-hooks-sync", (event) => {
    event.returnValue = getShellHookStatus();
  });

  ipcMain.handle("workspace-isolation/list", () => getStacks());
  ipcMain.handle("workspace-isolation/topologies", () => getProjectTopologies());
  ipcMain.handle("workspace-isolation/save-topology", async (_event, input: SaveWorkspaceIsolationInput) => saveProjectTopology(input));
  ipcMain.handle("workspace-isolation/delete-topology", async (_event, topologyId: string) => deleteProjectTopology(topologyId));
  ipcMain.handle("workspace-isolation/enable-workspace", async (_event, input: EnableWorkspaceIsolationInput) => enableWorkspace(input));
  ipcMain.handle("workspace-isolation/disable-workspace", async (_event, workspaceRootPath: string) => disableWorkspace(workspaceRootPath));
  ipcMain.handle("workspace-isolation/proxy-status", () => getProxyStatus());
  ipcMain.handle("workspace-isolation/mark-intro-seen", async () => ({
    success: await markIntroSeen(),
    seen: true,
  }));
  ipcMain.handle("settings/get-workspace-isolation-shell-hooks", () => getShellHookStatus());
  ipcMain.handle("settings/set-workspace-isolation-shell-hooks", async (_event, enabled: boolean) => {
    const status = await setShellHooksEnabled(Boolean(enabled));
    return {
      success: status.supported,
      enabled: status.enabled,
      error: status.supported ? undefined : status.message,
    };
  });
};
