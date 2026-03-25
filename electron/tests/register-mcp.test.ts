import assert from "node:assert/strict";
import test from "node:test";
import type { IpcMainInvokeEvent } from "electron";
import { registerMcpIpc } from "../ipc/register-mcp.js";

type IpcHandler = (event: IpcMainInvokeEvent, ...args: unknown[]) => Promise<unknown> | unknown;

const setupMcpIpc = () => {
  const handlers = new Map<string, IpcHandler>();
  const connectedTools: string[] = [];
  const fakeIpcMain = {
    handle: (channel: string, handler: IpcHandler) => {
      handlers.set(channel, handler);
    },
  } as Parameters<typeof registerMcpIpc>[0]["ipcMain"];

  return { connectedTools, fakeIpcMain, handlers };
};

test("registerMcpIpc uses Claude CLI helpers for Claude Code", async () => {
  const { connectedTools, fakeIpcMain, handlers } = setupMcpIpc();

  registerMcpIpc({
    ipcMain: fakeIpcMain,
    mcpConnected: (tool) => connectedTools.push(tool),
    checkClaudeInstalled: async () => true,
    installClaude: async () => ({ success: true }),
  });

  const checkHandler = handlers.get("mcp/check-installed");
  const installHandler = handlers.get("mcp/install");
  assert.equal(await checkHandler?.({} as IpcMainInvokeEvent, "Claude"), true);
  assert.deepEqual(await installHandler?.({} as IpcMainInvokeEvent, "Claude"), { success: true });
  assert.deepEqual(connectedTools, ["Claude"]);
});

test("registerMcpIpc keeps file-based config behavior for non-Claude tools", async () => {
  const { fakeIpcMain, handlers } = setupMcpIpc();
  const checkedPaths: string[] = [];
  const updatedPaths: string[] = [];

  registerMcpIpc({
    ipcMain: fakeIpcMain,
    mcpConnected: () => undefined,
    checkConfig: async (configPath) => {
      checkedPaths.push(configPath);
      return true;
    },
    homeDir: "/Users/tester",
    updateConfig: async (configPath) => {
      updatedPaths.push(configPath);
      return { success: true };
    },
  });

  const checkHandler = handlers.get("mcp/check-installed");
  const installHandler = handlers.get("mcp/install");
  assert.equal(await checkHandler?.({} as IpcMainInvokeEvent, "Cursor"), true);
  assert.deepEqual(await installHandler?.({} as IpcMainInvokeEvent, "Codex"), { success: true });
  assert.deepEqual(checkedPaths, ["/Users/tester/.cursor/mcp.json"]);
  assert.deepEqual(updatedPaths, ["/Users/tester/.codex/config.toml"]);
});

test("registerMcpIpc returns a clear error for unsupported tools", async () => {
  const { fakeIpcMain, handlers } = setupMcpIpc();

  registerMcpIpc({
    ipcMain: fakeIpcMain,
    mcpConnected: () => undefined,
  });

  const installHandler = handlers.get("mcp/install");
  assert.deepEqual(await installHandler?.({} as IpcMainInvokeEvent, "Unknown"), {
    success: false,
    error: "Tool not supported yet.",
  });
});
