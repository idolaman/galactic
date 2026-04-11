import type { IpcMain } from "electron";
import type {
  SaveWorkspaceIsolationInput,
  WorkspaceIsolationShellHookStatus,
  WorkspaceIsolationStack,
} from "../workspace-isolation/types.js";

interface WorkspaceIsolationIpcDeps {
  ipcMain: Pick<IpcMain, "handle" | "on">;
  getStacks: () => WorkspaceIsolationStack[];
  saveStack: (input: SaveWorkspaceIsolationInput) => Promise<{ success: boolean; error?: string; stack?: WorkspaceIsolationStack }>;
  deleteStack: (stackId: string) => Promise<{ success: boolean; error?: string }>;
  getShellHookStatus: () => WorkspaceIsolationShellHookStatus;
  setShellHooksEnabled: (enabled: boolean) => Promise<WorkspaceIsolationShellHookStatus>;
}

export const registerWorkspaceIsolationIpc = ({
  ipcMain,
  getStacks,
  saveStack,
  deleteStack,
  getShellHookStatus,
  setShellHooksEnabled,
}: WorkspaceIsolationIpcDeps): void => {
  ipcMain.on("workspace-isolation/get-sync", (event) => {
    event.returnValue = getStacks();
  });

  ipcMain.handle("workspace-isolation/list", () => getStacks());
  ipcMain.handle("workspace-isolation/save", async (_event, input: SaveWorkspaceIsolationInput) => saveStack(input));
  ipcMain.handle("workspace-isolation/delete", async (_event, stackId: string) => deleteStack(stackId));
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
