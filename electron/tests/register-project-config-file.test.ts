import assert from "node:assert/strict";
import test from "node:test";
import type { IpcMainInvokeEvent } from "electron";
import { registerProjectConfigFileIpc } from "../ipc/register-project-config-file.js";

type IpcHandler = (event: IpcMainInvokeEvent, ...args: unknown[]) => Promise<unknown> | unknown;

const createHandlers = ({
  saveResult = { canceled: true, filePath: "" },
  openResult = { canceled: true, filePaths: [] },
  readContent = "{}",
  writeSpy = () => undefined,
}: {
  saveResult?: { canceled: boolean; filePath: string };
  openResult?: { canceled: boolean; filePaths: string[] };
  readContent?: string;
  writeSpy?: (filePath: string, contents: string) => void;
} = {}) => {
  const handlers = new Map<string, IpcHandler>();
  registerProjectConfigFileIpc({
    ipcMain: {
      handle: (channel, handler) => {
        handlers.set(channel, handler);
        return {} as never;
      },
    },
    showSaveDialog: async () => saveResult,
    showOpenDialog: async () => openResult,
    writeFile: async (filePath, contents) => {
      writeSpy(filePath, contents);
    },
    readFile: async () => readContent,
  });
  return handlers;
};

test("project config file IPC returns canceled save and open results", async () => {
  const handlers = createHandlers();

  assert.deepEqual(
    await handlers.get("project-config/export-file")?.({} as IpcMainInvokeEvent, {
      defaultFileName: "project.json",
      payload: {},
    }),
    { canceled: true },
  );
  assert.deepEqual(
    await handlers.get("project-config/import-file")?.({} as IpcMainInvokeEvent),
    { canceled: true },
  );
});

test("project config export writes formatted JSON", async () => {
  let writtenPath = "";
  let writtenContents = "";
  const handlers = createHandlers({
    saveResult: { canceled: false, filePath: "/tmp/project.json" },
    writeSpy: (filePath, contents) => {
      writtenPath = filePath;
      writtenContents = contents;
    },
  });

  const result = await handlers.get("project-config/export-file")?.(
    {} as IpcMainInvokeEvent,
    {
      defaultFileName: "project.json",
      payload: { b: 1, nested: { ok: true } },
    },
  );

  assert.deepEqual(result, {
    canceled: false,
    success: true,
    filePath: "/tmp/project.json",
  });
  assert.equal(writtenPath, "/tmp/project.json");
  assert.equal(writtenContents, '{\n  "b": 1,\n  "nested": {\n    "ok": true\n  }\n}\n');
});

test("project config export rejects payloads that cannot become JSON text", async () => {
  let didWrite = false;
  const handlers = createHandlers({
    saveResult: { canceled: false, filePath: "/tmp/project.json" },
    writeSpy: () => {
      didWrite = true;
    },
  });

  assert.deepEqual(
    await handlers.get("project-config/export-file")?.(
      {} as IpcMainInvokeEvent,
      { defaultFileName: "project.json", payload: undefined },
    ),
    {
      canceled: false,
      success: false,
      error: "Project config export payload is not valid JSON.",
    },
  );
  assert.equal(didWrite, false);
});

test("project config import returns parsed payload", async () => {
  const handlers = createHandlers({
    openResult: { canceled: false, filePaths: ["/tmp/project.json"] },
    readContent: '{"ok":true}',
  });

  assert.deepEqual(
    await handlers.get("project-config/import-file")?.({} as IpcMainInvokeEvent),
    {
      canceled: false,
      success: true,
      filePath: "/tmp/project.json",
      payload: { ok: true },
    },
  );
});

test("project config import reports invalid JSON as a friendly failure", async () => {
  const handlers = createHandlers({
    openResult: { canceled: false, filePaths: ["/tmp/project.json"] },
    readContent: "{",
  });

  assert.deepEqual(
    await handlers.get("project-config/import-file")?.({} as IpcMainInvokeEvent),
    {
      canceled: false,
      success: false,
      filePath: "/tmp/project.json",
      error: "Selected file is not valid JSON.",
    },
  );
});
