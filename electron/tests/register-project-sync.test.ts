import assert from "node:assert/strict";
import test from "node:test";
import type { IpcMainInvokeEvent } from "electron";
import { registerProjectSyncIpc } from "../ipc/register-project-sync.js";

type IpcHandler = (event: IpcMainInvokeEvent, ...args: unknown[]) => Promise<unknown> | unknown;

test("registerProjectSyncIpc registers expected channels", async () => {
  const handlers = new Map<string, IpcHandler>();
  let trackedCount = -1;
  let trackedSuccess = false;

  const fakeIpcMain = {
    handle: (channel: string, handler: IpcHandler) => {
      handlers.set(channel, handler);
    },
  } as Parameters<typeof registerProjectSyncIpc>[0]["ipcMain"];

  registerProjectSyncIpc({
    ipcMain: fakeIpcMain,
    workspaceFilesCopied: (count, success) => {
      trackedCount = count;
      trackedSuccess = success;
    },
  });

  assert.equal(handlers.has("project/search-sync-targets"), true);
  assert.equal(handlers.has("project/copy-sync-targets-to-worktree"), true);

  const searchHandler = handlers.get("project/search-sync-targets");
  const copyHandler = handlers.get("project/copy-sync-targets-to-worktree");
  assert.equal(typeof searchHandler, "function");
  assert.equal(typeof copyHandler, "function");

  const invalidSearchResult = await searchHandler?.({} as IpcMainInvokeEvent, "");
  assert.deepEqual(invalidSearchResult, []);

  const invalidCopyResult = await copyHandler?.({} as IpcMainInvokeEvent, "", "", []);
  assert.deepEqual(invalidCopyResult, {
    success: false,
    copied: [],
    skipped: [],
    errors: [{ file: "", message: "Invalid copy parameters." }],
  });
  assert.equal(trackedCount, -1);
  assert.equal(trackedSuccess, false);
});
