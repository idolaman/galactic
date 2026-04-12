import type { IpcMain } from "electron";
import type {
  WorkspaceIsolationProxyStatus,
  SaveWorkspaceIsolationInput,
  WorkspaceIsolationShellHookStatus,
  WorkspaceIsolationStack,
} from "../workspace-isolation/types.js";

interface WorkspaceIsolationIpcDeps {
  ipcMain: Pick<IpcMain, "handle" | "on">;
  getStacks: () => WorkspaceIsolationStack[];
  getIntroSeen: () => boolean;
  saveStack: (input: SaveWorkspaceIsolationInput) => Promise<{ success: boolean; error?: string; stack?: WorkspaceIsolationStack }>;
  deleteStack: (stackId: string) => Promise<{ success: boolean; error?: string }>;
  getShellHookStatus: () => WorkspaceIsolationShellHookStatus;
  getProxyStatus: () => WorkspaceIsolationProxyStatus;
  markIntroSeen: () => Promise<boolean>;
  setShellHooksEnabled: (enabled: boolean) => Promise<WorkspaceIsolationShellHookStatus>;
}

export const registerWorkspaceIsolationIpc = ({
  ipcMain,
  getStacks,
  getIntroSeen,
  saveStack,
  deleteStack,
  getShellHookStatus,
  getProxyStatus,
  markIntroSeen,
  setShellHooksEnabled,
}: WorkspaceIsolationIpcDeps): void => {
  ipcMain.on("workspace-isolation/get-sync", (event) => {
    event.returnValue = getStacks();
  });
  ipcMain.on("workspace-isolation/get-intro-seen-sync", (event) => {
    event.returnValue = getIntroSeen();
  });
  ipcMain.on("workspace-isolation/get-shell-hooks-sync", (event) => {
    event.returnValue = getShellHookStatus();
  });

  ipcMain.handle("workspace-isolation/list", () => getStacks());
  ipcMain.handle("workspace-isolation/save", async (_event, input: SaveWorkspaceIsolationInput) => saveStack(input));
  ipcMain.handle("workspace-isolation/delete", async (_event, stackId: string) => deleteStack(stackId));
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
