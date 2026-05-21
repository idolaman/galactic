import assert from "node:assert/strict";
import test from "node:test";
import type { IpcMainInvokeEvent } from "electron";
import { registerWorkspaceConsoleIpc } from "../ipc/register-workspace-console.js";
import type {
  CreateWorkspaceConsoleSessionInput,
  WorkspaceConsoleSessionSummary,
} from "../workspace-console/types.js";

type IpcHandler = (event: IpcMainInvokeEvent, ...args: unknown[]) => Promise<unknown> | unknown;

const createSession = (input: CreateWorkspaceConsoleSessionInput): WorkspaceConsoleSessionSummary => ({
  sessionId: "session-1",
  workspacePath: input.workspacePath,
  workspaceLabel: input.workspaceLabel ?? "Workspace",
  cwd: input.cwd ?? input.workspacePath,
  status: "running",
  title: input.workspaceLabel ?? "Workspace",
  createdAt: 1,
});

test("registerWorkspaceConsoleIpc registers expected channels", () => {
  const handlers = new Map<string, IpcHandler>();
  registerWorkspaceConsoleIpc({
    ipcMain: { handle: (channel, handler) => handlers.set(channel, handler) },
    sessionManager: {
      createSession: (input) => ({ success: true, value: createSession(input) }),
      killSession: () => ({ success: true }),
      listSessions: () => [],
      resize: () => ({ success: true }),
      writeInput: () => ({ success: true }),
    },
  });

  assert.deepEqual(Array.from(handlers.keys()), [
    "workspace-console/create-session",
    "workspace-console/list-sessions",
    "workspace-console/write-input",
    "workspace-console/resize",
    "workspace-console/kill-session",
  ]);
});

test("workspace console IPC validates invalid inputs", async () => {
  const handlers = new Map<string, IpcHandler>();
  registerWorkspaceConsoleIpc({
    ipcMain: { handle: (channel, handler) => handlers.set(channel, handler) },
    sessionManager: {
      createSession: (input) => ({ success: true, value: createSession(input) }),
      killSession: () => ({ success: true }),
      listSessions: () => [],
      resize: () => ({ success: true }),
      writeInput: () => ({ success: true }),
    },
  });

  assert.deepEqual(
    await handlers.get("workspace-console/create-session")?.({} as IpcMainInvokeEvent, {}),
    { success: false, error: "Workspace path is required." },
  );
  assert.deepEqual(
    await handlers.get("workspace-console/write-input")?.({} as IpcMainInvokeEvent, "", 42),
    { success: false, error: "Terminal input is invalid." },
  );
  assert.deepEqual(
    await handlers.get("workspace-console/create-session")?.({} as IpcMainInvokeEvent, {
      cols: 0,
      workspacePath: "/repo",
    }),
    { success: false, error: "Terminal size is invalid." },
  );
  assert.deepEqual(
    await handlers.get("workspace-console/resize")?.({} as IpcMainInvokeEvent, "s1", 0, 20),
    { success: false, error: "Terminal size is invalid." },
  );
});

test("workspace console IPC delegates create list write resize and kill", async () => {
  const handlers = new Map<string, IpcHandler>();
  const calls: string[] = [];
  registerWorkspaceConsoleIpc({
    ipcMain: { handle: (channel, handler) => handlers.set(channel, handler) },
    sessionManager: {
      createSession: (input) => {
        calls.push(`create:${input.workspacePath}`);
        return { success: true, value: createSession(input) };
      },
      killSession: (sessionId) => {
        calls.push(`kill:${sessionId}`);
        return { success: true };
      },
      listSessions: () => {
        calls.push("list");
        return [];
      },
      resize: (sessionId, cols, rows) => {
        calls.push(`resize:${sessionId}:${cols}:${rows}`);
        return { success: true };
      },
      writeInput: (sessionId, data) => {
        calls.push(`write:${sessionId}:${data}`);
        return { success: true };
      },
    },
  });

  await handlers.get("workspace-console/create-session")?.({} as IpcMainInvokeEvent, {
    workspacePath: "/repo",
  });
  await handlers.get("workspace-console/list-sessions")?.({} as IpcMainInvokeEvent);
  await handlers.get("workspace-console/write-input")?.({} as IpcMainInvokeEvent, "s1", "ls\r");
  await handlers.get("workspace-console/resize")?.({} as IpcMainInvokeEvent, "s1", 80, 24);
  await handlers.get("workspace-console/kill-session")?.({} as IpcMainInvokeEvent, "s1");

  assert.deepEqual(calls, [
    "create:/repo",
    "list",
    "write:s1:ls\r",
    "resize:s1:80:24",
    "kill:s1",
  ]);
});
