import assert from "node:assert/strict";
import test from "node:test";
import type { IpcMainInvokeEvent, IpcMainEvent } from "electron";
import { registerWorkspaceIsolationIpc } from "../ipc/register-workspace-isolation.js";

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
    saveStack: async (input) => ({ success: true, stack: { ...stacks[0], id: input.id } }),
    deleteStack: async () => ({ success: true }),
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
    setShellHooksEnabled: async (enabled) => ({
      enabled,
      supported: true,
      installed: enabled,
      hookPath: "/hook.zsh",
      zshrcPath: "/.zshrc",
      message: "updated",
    }),
  });

  assert.equal(onHandlers.has("workspace-isolation/get-sync"), true);
  assert.equal(onHandlers.has("workspace-isolation/get-shell-hooks-sync"), true);
  assert.equal(handleHandlers.has("workspace-isolation/list"), true);
  assert.equal(handleHandlers.has("workspace-isolation/save"), true);
  assert.equal(handleHandlers.has("workspace-isolation/delete"), true);
  assert.equal(handleHandlers.has("workspace-isolation/proxy-status"), true);
  assert.equal(handleHandlers.has("settings/get-workspace-isolation-shell-hooks"), true);
  assert.equal(handleHandlers.has("settings/set-workspace-isolation-shell-hooks"), true);

  const syncEvent = { returnValue: null } as unknown as IpcMainEvent & { returnValue: unknown };
  onHandlers.get("workspace-isolation/get-sync")?.(syncEvent);
  assert.deepEqual(syncEvent.returnValue, stacks);

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

  const saveResult = await handleHandlers.get("workspace-isolation/save")?.(
    {} as IpcMainInvokeEvent,
    {
      id: "stack-2",
      name: "demo",
      projectId: "project-1",
      workspaceRootPath: "/repo",
      workspaceRootLabel: "Repository Root",
      projectName: "demo",
      workspaceMode: "single-app",
      services: [],
    },
  );
  assert.deepEqual(saveResult, { success: true, stack: { ...stacks[0], id: "stack-2" } });

  const proxyStatus = await handleHandlers.get("workspace-isolation/proxy-status")?.(
    {} as IpcMainInvokeEvent,
  );
  assert.deepEqual(proxyStatus, {
    running: true,
    port: 1355,
    message: "Proxy running on localhost:1355.",
  });

  const toggleResult = await handleHandlers.get("settings/set-workspace-isolation-shell-hooks")?.(
    {} as IpcMainInvokeEvent,
    false,
  );
  assert.deepEqual(toggleResult, { success: true, enabled: false, error: undefined });
});
