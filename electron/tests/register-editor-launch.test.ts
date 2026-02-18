import assert from "node:assert/strict";
import test from "node:test";
import type { IpcMainInvokeEvent } from "electron";
import { registerEditorLaunchIpc } from "../ipc/register-editor-launch.js";
import type { EditorLaunchService } from "../editor-launch/types.js";

type IpcHandler = (event: IpcMainInvokeEvent, ...args: unknown[]) => Promise<unknown> | unknown;

const setupEditorLaunchIpc = (
  editorLaunchService: EditorLaunchService,
  projectPathExists: (projectPath: string) => boolean = () => true,
) => {
  const handlers = new Map<string, IpcHandler>();
  const launchedEditors: string[] = [];
  const fakeIpcMain = {
    handle: (channel: string, handler: IpcHandler) => {
      handlers.set(channel, handler);
    },
  } as Parameters<typeof registerEditorLaunchIpc>[0]["ipcMain"];

  registerEditorLaunchIpc({
    ipcMain: fakeIpcMain,
    editorLaunched: (editor) => launchedEditors.push(editor),
    projectPathExists,
    editorLaunchService,
  });

  return { handlers, launchedEditors };
};

test("registerEditorLaunchIpc registers expected channels and returns validation errors", async () => {
  const fakeEditorLaunchService: EditorLaunchService = {
    checkEditorInstalled: async (editorName: string) => editorName === "VSCode",
    openProject: async (_editorName: string, projectPath: string) => {
      return {
        success: true,
        usedEditor: "VSCode",
        fallbackApplied: projectPath === "/project",
      };
    },
  };
  const { handlers, launchedEditors } = setupEditorLaunchIpc(
    fakeEditorLaunchService,
    (projectPath) => projectPath === "/project",
  );

  assert.equal(handlers.has("check-editor-installed"), true);
  assert.equal(handlers.has("editor/open-project"), true);

  const checkEditorInstalledHandler = handlers.get("check-editor-installed");
  const openEditorHandler = handlers.get("editor/open-project");
  assert.equal(typeof checkEditorInstalledHandler, "function");
  assert.equal(typeof openEditorHandler, "function");

  const vscodeInstalled = await checkEditorInstalledHandler?.({} as IpcMainInvokeEvent, "VSCode");
  const cursorInstalled = await checkEditorInstalledHandler?.({} as IpcMainInvokeEvent, "Cursor");
  assert.equal(vscodeInstalled, true);
  assert.equal(cursorInstalled, false);

  const missingPath = await openEditorHandler?.({} as IpcMainInvokeEvent, "Cursor", "");
  assert.deepEqual(missingPath, { success: false, error: "No project path provided." });

  const invalidPath = await openEditorHandler?.({} as IpcMainInvokeEvent, "Cursor", "/missing");
  assert.deepEqual(invalidPath, { success: false, error: "Project path does not exist." });

  const successResult = await openEditorHandler?.({} as IpcMainInvokeEvent, "Cursor", "/project");
  assert.deepEqual(successResult, {
    success: true,
    usedEditor: "VSCode",
    fallbackApplied: true,
  });
  assert.deepEqual(launchedEditors, ["VSCode"]);
});

test("editor/open-project falls back to VSCode when Cursor is selected but unavailable", async () => {
  const fakeEditorLaunchService: EditorLaunchService = {
    checkEditorInstalled: async (editorName: string) => editorName === "VSCode",
    openProject: async (editorName: string) => {
      assert.equal(editorName, "Cursor");
      return {
        success: true,
        usedEditor: "VSCode",
        fallbackApplied: true,
      };
    },
  };
  const { handlers, launchedEditors } = setupEditorLaunchIpc(fakeEditorLaunchService);
  const openEditorHandler = handlers.get("editor/open-project");
  assert.equal(typeof openEditorHandler, "function");

  const result = await openEditorHandler?.({} as IpcMainInvokeEvent, "Cursor", "/project");
  assert.deepEqual(result, {
    success: true,
    usedEditor: "VSCode",
    fallbackApplied: true,
  });
  assert.deepEqual(launchedEditors, ["VSCode"]);
});

test("editor/open-project falls back to Cursor when VSCode is selected but unavailable", async () => {
  const fakeEditorLaunchService: EditorLaunchService = {
    checkEditorInstalled: async (editorName: string) => editorName === "Cursor",
    openProject: async (editorName: string) => {
      assert.equal(editorName, "VSCode");
      return {
        success: true,
        usedEditor: "Cursor",
        fallbackApplied: true,
      };
    },
  };
  const { handlers, launchedEditors } = setupEditorLaunchIpc(fakeEditorLaunchService);
  const openEditorHandler = handlers.get("editor/open-project");
  assert.equal(typeof openEditorHandler, "function");

  const result = await openEditorHandler?.({} as IpcMainInvokeEvent, "VSCode", "/project");
  assert.deepEqual(result, {
    success: true,
    usedEditor: "Cursor",
    fallbackApplied: true,
  });
  assert.deepEqual(launchedEditors, ["Cursor"]);
});

test("editor/open-project returns a clear error when both editors are unavailable", async () => {
  const fakeEditorLaunchService: EditorLaunchService = {
    checkEditorInstalled: async () => false,
    openProject: async () => {
      return {
        success: false,
        error: "No supported editor installation found. Install Cursor or Visual Studio Code.",
      };
    },
  };
  const { handlers, launchedEditors } = setupEditorLaunchIpc(fakeEditorLaunchService);
  const openEditorHandler = handlers.get("editor/open-project");
  assert.equal(typeof openEditorHandler, "function");

  const result = await openEditorHandler?.({} as IpcMainInvokeEvent, "Cursor", "/project");
  assert.deepEqual(result, {
    success: false,
    error: "No supported editor installation found. Install Cursor or Visual Studio Code.",
  });
  assert.deepEqual(launchedEditors, []);
});
