import type { IpcMain } from "electron";
import type {
  EnableWorkspaceIsolationInput,
  WorkspaceIsolationProxyStatus,
  SaveWorkspaceIsolationInput,
  WorkspaceIsolationShellHookStatus,
  WorkspaceIsolationProjectTopology,
  WorkspaceIsolationStack,
} from "../workspace-isolation/types.js";
import {
  mutateScopedState,
  readScopedState,
} from "./workspace-isolation-ipc-results.js";

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
  setActiveUser: (userId: string) => Promise<void>;
  clearActiveUser: () => Promise<void>;
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
  setActiveUser,
  clearActiveUser,
}: WorkspaceIsolationIpcDeps): void => {
  ipcMain.on("workspace-isolation/get-sync", (event) => {
    event.returnValue = readScopedState(
      getStacks,
      "Project Services are unavailable.",
    );
  });
  ipcMain.on("workspace-isolation/get-topologies-sync", (event) => {
    event.returnValue = readScopedState(
      getProjectTopologies,
      "Project Services are unavailable.",
    );
  });
  ipcMain.on("workspace-isolation/get-intro-seen-sync", (event) => {
    event.returnValue = getIntroSeen();
  });
  ipcMain.on("workspace-isolation/get-shell-hooks-sync", (event) => {
    event.returnValue = getShellHookStatus();
  });

  ipcMain.handle("workspace-isolation/list", () => {
    return readScopedState(
      () => ({ success: true, stacks: getStacks() }),
      "Project Services are unavailable.",
    );
  });
  ipcMain.handle("workspace-isolation/topologies", () => {
    return readScopedState(
      () => ({ success: true, topologies: getProjectTopologies() }),
      "Project Services are unavailable.",
    );
  });
  ipcMain.handle("workspace-isolation/save-topology", async (_event, input: SaveWorkspaceIsolationInput) => {
    return await mutateScopedState(
      () => saveProjectTopology(input),
      "Failed to save Project Services.",
    );
  });
  ipcMain.handle("workspace-isolation/delete-topology", async (_event, topologyId: string) => {
    return await mutateScopedState(
      () => deleteProjectTopology(topologyId),
      "Failed to remove Project Services.",
    );
  });
  ipcMain.handle("workspace-isolation/enable-workspace", async (_event, input: EnableWorkspaceIsolationInput) => {
    return await mutateScopedState(
      () => enableWorkspace(input),
      "Failed to activate Project Services.",
    );
  });
  ipcMain.handle("workspace-isolation/disable-workspace", async (_event, workspaceRootPath: string) => {
    return await mutateScopedState(
      () => disableWorkspace(workspaceRootPath),
      "Failed to stop Project Services.",
    );
  });
  ipcMain.handle("workspace-isolation/proxy-status", () => getProxyStatus());
  ipcMain.handle("workspace-isolation/set-active-user", async (_event, userId: string) => {
    return await mutateScopedState(async () => {
      await setActiveUser(userId);
      return { success: true };
    }, "Failed to set Project Services storage scope.");
  });
  ipcMain.handle("workspace-isolation/clear-active-user", async () => {
    return await mutateScopedState(async () => {
      await clearActiveUser();
      return { success: true };
    }, "Failed to clear Project Services storage scope.");
  });
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
