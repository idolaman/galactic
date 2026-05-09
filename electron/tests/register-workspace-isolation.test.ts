import assert from "node:assert/strict";
import test from "node:test";
import type { IpcMainInvokeEvent, IpcMainEvent } from "electron";
import { registerWorkspaceIsolationIpc } from "../ipc/register-workspace-isolation.js";
import type {
  EnableWorkspaceIsolationInput,
  SaveWorkspaceIsolationInput,
} from "../workspace-isolation/types.js";

type HandleHandler = (event: IpcMainInvokeEvent, ...args: unknown[]) => Promise<unknown> | unknown;
type OnHandler = (event: IpcMainEvent, ...args: unknown[]) => void;

test("registerWorkspaceIsolationIpc registers handlers and sync bootstrap", async () => {
  const handleHandlers = new Map<string, HandleHandler>();
  const onHandlers = new Map<string, OnHandler>();
  const stacks = [{
    id: "stack-1",
    kind: "workspace-isolation" as const,
    name: "demo",
    slug: "demo",
    projectId: "project-1",
    workspaceRootPath: "/repo",
    workspaceRootLabel: "Repository Root",
    projectName: "demo",
    workspaceMode: "single-app" as const,
    createdAt: 1,
    services: [],
  }];

  registerWorkspaceIsolationIpc({
    ipcMain: {
      handle: (channel, handler) => {
        handleHandlers.set(channel, handler);
        return {} as never;
      },
      on: (channel, handler) => {
        onHandlers.set(channel, handler);
        return {} as never;
      },
    },
    getStacks: () => stacks,
    getProjectTopologies: () => stacks,
    getIntroSeen: () => true,
    saveProjectTopology: async (_input: SaveWorkspaceIsolationInput) => ({
      success: true,
      topology: stacks[0],
    }),
    deleteProjectTopology: async () => ({ success: true }),
    enableWorkspace: async (_input: EnableWorkspaceIsolationInput) => ({
      success: true,
      stack: stacks[0],
    }),
    disableWorkspace: async () => ({ success: true }),
    getShellHookStatus: () => ({
      enabled: true,
      supported: true,
      installed: true,
      hookPath: "/hook.zsh",
      zshrcPath: "/.zshrc",
      message: "ready",
    }),
    getProxyStatus: () => ({
      running: true,
      port: 1355,
      message: "Proxy running on localhost:1355.",
    }),
    markIntroSeen: async () => true,
    setShellHooksEnabled: async (enabled) => ({
      enabled,
      supported: true,
      installed: enabled,
      hookPath: "/hook.zsh",
      zshrcPath: "/.zshrc",
      message: "updated",
    }),
    setActiveUser: async (userId) => {
      if (!userId.trim()) {
        throw new Error("Project Services storage requires an active signed-in user.");
      }
    },
    clearActiveUser: async () => undefined,
  });

  assert.equal(onHandlers.has("workspace-isolation/get-sync"), true);
  assert.equal(onHandlers.has("workspace-isolation/get-topologies-sync"), true);
  assert.equal(onHandlers.has("workspace-isolation/get-intro-seen-sync"), true);
  assert.equal(onHandlers.has("workspace-isolation/get-shell-hooks-sync"), true);
  assert.equal(handleHandlers.has("workspace-isolation/list"), true);
  assert.equal(handleHandlers.has("workspace-isolation/topologies"), true);
  assert.equal(handleHandlers.has("workspace-isolation/save-topology"), true);
  assert.equal(handleHandlers.has("workspace-isolation/delete-topology"), true);
  assert.equal(handleHandlers.has("workspace-isolation/enable-workspace"), true);
  assert.equal(handleHandlers.has("workspace-isolation/disable-workspace"), true);
  assert.equal(handleHandlers.has("workspace-isolation/proxy-status"), true);
  assert.equal(handleHandlers.has("workspace-isolation/set-active-user"), true);
  assert.equal(handleHandlers.has("workspace-isolation/clear-active-user"), true);
  assert.equal(handleHandlers.has("settings/get-workspace-isolation-shell-hooks"), true);
  assert.equal(handleHandlers.has("settings/set-workspace-isolation-shell-hooks"), true);

  const syncEvent = { returnValue: null } as unknown as IpcMainEvent & { returnValue: unknown };
  onHandlers.get("workspace-isolation/get-sync")?.(syncEvent);
  assert.deepEqual(syncEvent.returnValue, stacks);

  const topologiesSyncEvent = {
    returnValue: null,
  } as unknown as IpcMainEvent & { returnValue: unknown };
  onHandlers.get("workspace-isolation/get-topologies-sync")?.(topologiesSyncEvent);
  assert.deepEqual(topologiesSyncEvent.returnValue, stacks);

  const shellHookSyncEvent = { returnValue: null } as unknown as IpcMainEvent & { returnValue: unknown };
  onHandlers.get("workspace-isolation/get-shell-hooks-sync")?.(shellHookSyncEvent);
  assert.deepEqual(shellHookSyncEvent.returnValue, {
    enabled: true,
    supported: true,
    installed: true,
    hookPath: "/hook.zsh",
    zshrcPath: "/.zshrc",
    message: "ready",
  });

  const introSeenSyncEvent = { returnValue: null } as unknown as IpcMainEvent & { returnValue: unknown };
  onHandlers.get("workspace-isolation/get-intro-seen-sync")?.(introSeenSyncEvent);
  assert.equal(introSeenSyncEvent.returnValue, true);

  const saveResult = await handleHandlers.get("workspace-isolation/save-topology")?.(
    {} as IpcMainInvokeEvent,
    {
      name: "demo",
      projectId: "project-1",
      workspaceRootPath: "/repo",
      workspaceRootLabel: "Repository Root",
      projectName: "demo",
      workspaceMode: "single-app",
      services: [],
    },
  );
  assert.deepEqual(saveResult, {
    success: true,
    topology: stacks[0],
  });

  const listResult = await handleHandlers.get("workspace-isolation/list")?.(
    {} as IpcMainInvokeEvent,
  );
  assert.deepEqual(listResult, {
    success: true,
    stacks,
  });

  const topologiesResult = await handleHandlers.get("workspace-isolation/topologies")?.(
    {} as IpcMainInvokeEvent,
  );
  assert.deepEqual(topologiesResult, {
    success: true,
    topologies: stacks,
  });

  const enableResult = await handleHandlers.get(
    "workspace-isolation/enable-workspace",
  )?.({} as IpcMainInvokeEvent, {
    projectId: "project-1",
    projectName: "demo",
    workspaceRootPath: "/repo/.worktrees/feature-a",
    workspaceRootLabel: "feature-a",
  });
  assert.deepEqual(enableResult, {
    success: true,
    stack: stacks[0],
  });

  const proxyStatus = await handleHandlers.get("workspace-isolation/proxy-status")?.(
    {} as IpcMainInvokeEvent,
  );
  assert.deepEqual(proxyStatus, {
    running: true,
    port: 1355,
    message: "Proxy running on localhost:1355.",
  });

  const setActiveUserResult = await handleHandlers.get("workspace-isolation/set-active-user")?.(
    {} as IpcMainInvokeEvent,
    "user-1",
  );
  assert.deepEqual(setActiveUserResult, { success: true });

  const blankActiveUserResult = await handleHandlers.get("workspace-isolation/set-active-user")?.(
    {} as IpcMainInvokeEvent,
    "",
  );
  assert.deepEqual(blankActiveUserResult, {
    success: false,
    error: "Project Services storage requires an active signed-in user.",
  });

  const clearActiveUserResult = await handleHandlers.get("workspace-isolation/clear-active-user")?.(
    {} as IpcMainInvokeEvent,
  );
  assert.deepEqual(clearActiveUserResult, { success: true });

  const markIntroSeenResult = await handleHandlers.get("workspace-isolation/mark-intro-seen")?.(
    {} as IpcMainInvokeEvent,
  );
  assert.deepEqual(markIntroSeenResult, { success: true, seen: true });

  const toggleResult = await handleHandlers.get("settings/set-workspace-isolation-shell-hooks")?.(
    {} as IpcMainInvokeEvent,
    false,
  );
  assert.deepEqual(toggleResult, { success: true, enabled: false, error: undefined });
});

test("registerWorkspaceIsolationIpc returns auth-required failures for inactive scoped state", async () => {
  const handleHandlers = new Map<string, HandleHandler>();
  const onHandlers = new Map<string, OnHandler>();
  const authRequired = new Error("Project Services storage requires an active signed-in user.");

  registerWorkspaceIsolationIpc({
    ipcMain: {
      handle: (channel, handler) => {
        handleHandlers.set(channel, handler);
        return {} as never;
      },
      on: (channel, handler) => {
        onHandlers.set(channel, handler);
        return {} as never;
      },
    },
    getStacks: () => {
      throw authRequired;
    },
    getProjectTopologies: () => {
      throw authRequired;
    },
    getIntroSeen: () => false,
    saveProjectTopology: async () => {
      throw authRequired;
    },
    deleteProjectTopology: async () => {
      throw authRequired;
    },
    enableWorkspace: async () => {
      throw authRequired;
    },
    disableWorkspace: async () => {
      throw authRequired;
    },
    getShellHookStatus: () => ({
      enabled: false,
      supported: true,
      installed: false,
      hookPath: null,
      zshrcPath: null,
    }),
    getProxyStatus: () => ({ running: true, port: 1355 }),
    markIntroSeen: async () => true,
    setShellHooksEnabled: async (enabled) => ({
      enabled,
      supported: true,
      installed: enabled,
      hookPath: null,
      zshrcPath: null,
    }),
    setActiveUser: async () => {
      throw authRequired;
    },
    clearActiveUser: async () => undefined,
  });

  const listResult = await handleHandlers.get("workspace-isolation/list")?.(
    {} as IpcMainInvokeEvent,
  );
  assert.deepEqual(listResult, {
    success: false,
    error: authRequired.message,
  });

  const topologiesSyncEvent = {
    returnValue: null,
  } as unknown as IpcMainEvent & { returnValue: unknown };
  onHandlers.get("workspace-isolation/get-topologies-sync")?.(topologiesSyncEvent);
  assert.deepEqual(topologiesSyncEvent.returnValue, {
    success: false,
    error: authRequired.message,
  });
});
