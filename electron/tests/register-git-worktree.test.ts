import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import type { IpcMainInvokeEvent } from "electron";
import { registerGitWorktreeIpc } from "../ipc/register-git-worktree.js";

type IpcHandler = (event: IpcMainInvokeEvent, ...args: unknown[]) => Promise<unknown> | unknown;

test("registerGitWorktreeIpc registers create-worktree handler", () => {
  const handlers = new Map<string, IpcHandler>();
  const fakeIpcMain = {
    handle: (channel: string, handler: IpcHandler) => {
      handlers.set(channel, handler);
    },
  } as Parameters<typeof registerGitWorktreeIpc>[0]["ipcMain"];

  registerGitWorktreeIpc({
    ipcMain: fakeIpcMain,
    workspaceCreated: () => undefined,
    gitFailed: () => undefined,
  });

  assert.equal(handlers.has("git/create-worktree"), true);
});

test("create-worktree rejects invalid parameters", async () => {
  const handlers = new Map<string, IpcHandler>();
  const fakeIpcMain = {
    handle: (channel: string, handler: IpcHandler) => {
      handlers.set(channel, handler);
    },
  } as Parameters<typeof registerGitWorktreeIpc>[0]["ipcMain"];

  registerGitWorktreeIpc({
    ipcMain: fakeIpcMain,
    workspaceCreated: () => undefined,
    gitFailed: () => undefined,
  });

  const createHandler = handlers.get("git/create-worktree");
  const result = await createHandler?.({} as IpcMainInvokeEvent, "", "");
  assert.deepEqual(result, { success: false, error: "Project path and branch are required." });
});

test("create-worktree uses provided start point when createBranch is true", async () => {
  const handlers = new Map<string, IpcHandler>();
  const gitArgs: string[][] = [];
  let createdBranch = "";

  const fakeIpcMain = {
    handle: (channel: string, handler: IpcHandler) => {
      handlers.set(channel, handler);
    },
  } as Parameters<typeof registerGitWorktreeIpc>[0]["ipcMain"];

  registerGitWorktreeIpc({
    ipcMain: fakeIpcMain,
    workspaceCreated: (branch) => {
      createdBranch = branch;
    },
    gitFailed: () => undefined,
    projectPathExists: () => true,
    ensureDirectory: () => undefined,
    runGit: async (args) => {
      gitArgs.push(args);
    },
  });

  const createHandler = handlers.get("git/create-worktree");
  const expectedPath = path.join(path.resolve("/repo", ".."), ".worktrees", "repo", "feature-new-workspace");
  const result = await createHandler?.(
    {} as IpcMainInvokeEvent,
    "/repo",
    "feature/new-workspace",
    { createBranch: true, startPoint: "develop" },
  );

  assert.deepEqual(gitArgs[0], ["worktree", "add", "-b", "feature/new-workspace", expectedPath, "develop"]);
  assert.equal(createdBranch, "feature/new-workspace");
  assert.deepEqual(result, { success: true, path: expectedPath });
});

test("create-worktree uses existing branch mode when createBranch is false", async () => {
  const handlers = new Map<string, IpcHandler>();
  const gitArgs: string[][] = [];

  const fakeIpcMain = {
    handle: (channel: string, handler: IpcHandler) => {
      handlers.set(channel, handler);
    },
  } as Parameters<typeof registerGitWorktreeIpc>[0]["ipcMain"];

  registerGitWorktreeIpc({
    ipcMain: fakeIpcMain,
    workspaceCreated: () => undefined,
    gitFailed: () => undefined,
    projectPathExists: () => true,
    ensureDirectory: () => undefined,
    runGit: async (args) => {
      gitArgs.push(args);
    },
  });

  const createHandler = handlers.get("git/create-worktree");
  const expectedPath = path.join(path.resolve("/repo", ".."), ".worktrees", "repo", "main");
  await createHandler?.({} as IpcMainInvokeEvent, "/repo", "main", { createBranch: false });

  assert.deepEqual(gitArgs[0], ["worktree", "add", expectedPath, "main"]);
});

test("create-worktree treats null options as default behavior", async () => {
  const handlers = new Map<string, IpcHandler>();
  const gitArgs: string[][] = [];

  const fakeIpcMain = {
    handle: (channel: string, handler: IpcHandler) => {
      handlers.set(channel, handler);
    },
  } as Parameters<typeof registerGitWorktreeIpc>[0]["ipcMain"];

  registerGitWorktreeIpc({
    ipcMain: fakeIpcMain,
    workspaceCreated: () => undefined,
    gitFailed: () => undefined,
    projectPathExists: () => true,
    ensureDirectory: () => undefined,
    runGit: async (args) => {
      gitArgs.push(args);
    },
  });

  const createHandler = handlers.get("git/create-worktree");
  const expectedPath = path.join(path.resolve("/repo", ".."), ".worktrees", "repo", "main");
  await createHandler?.({} as IpcMainInvokeEvent, "/repo", "main", null);

  assert.deepEqual(gitArgs[0], ["worktree", "add", expectedPath, "main"]);
});

test("create-worktree rejects new branch creation when start point is missing", async () => {
  const handlers = new Map<string, IpcHandler>();
  const fakeIpcMain = {
    handle: (channel: string, handler: IpcHandler) => {
      handlers.set(channel, handler);
    },
  } as Parameters<typeof registerGitWorktreeIpc>[0]["ipcMain"];

  registerGitWorktreeIpc({
    ipcMain: fakeIpcMain,
    workspaceCreated: () => undefined,
    gitFailed: () => undefined,
    projectPathExists: () => true,
    ensureDirectory: () => undefined,
    runGit: async () => undefined,
  });

  const createHandler = handlers.get("git/create-worktree");
  const result = await createHandler?.(
    {} as IpcMainInvokeEvent,
    "/repo",
    "feature/new-workspace",
    { createBranch: true },
  );

  assert.deepEqual(result, {
    success: false,
    error: "Start point branch is required for new branch creation.",
  });
});

test("create-worktree returns failure and tracks git error", async () => {
  const handlers = new Map<string, IpcHandler>();
  let trackedOperation = "";
  let trackedMessage = "";

  const fakeIpcMain = {
    handle: (channel: string, handler: IpcHandler) => {
      handlers.set(channel, handler);
    },
  } as Parameters<typeof registerGitWorktreeIpc>[0]["ipcMain"];

  registerGitWorktreeIpc({
    ipcMain: fakeIpcMain,
    workspaceCreated: () => undefined,
    gitFailed: (operation, error) => {
      trackedOperation = operation;
      trackedMessage = error;
    },
    projectPathExists: () => true,
    ensureDirectory: () => undefined,
    runGit: async () => {
      const error = Object.assign(new Error("command failed"), { stderr: "fatal: worktree add failed" });
      throw error;
    },
  });

  const createHandler = handlers.get("git/create-worktree");
  const result = await createHandler?.(
    {} as IpcMainInvokeEvent,
    "/repo",
    "feature/fail",
    { createBranch: true, startPoint: "main" },
  );

  assert.deepEqual(result, { success: false, error: "fatal: worktree add failed" });
  assert.equal(trackedOperation, "worktree-add");
  assert.equal(trackedMessage, "fatal: worktree add failed");
});
