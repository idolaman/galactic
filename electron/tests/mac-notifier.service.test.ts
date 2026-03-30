import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import test from "node:test";
import type { ChildProcess } from "node:child_process";
import {
  createMacNotifierService,
  getPackagedMacNotifierAppPath,
} from "../mac-notifier/service.js";
import type { MacNotifierPayload } from "../mac-notifier/types.js";

class FakeChildProcess extends EventEmitter {
  public unrefCalled = false;

  public unref() {
    this.unrefCalled = true;
  }
}

const createPayload = (): MacNotifierPayload => ({
  actionText: "Open in Cursor",
  body: "galactic-ide | main | 5m",
  launchTargets: [
    {
      appName: "Cursor",
      editor: "Cursor",
      workspacePath: "/tmp/project.code-workspace",
    },
  ],
  signature: "session-1:done",
  subtitle: "Ship the notifier helper",
  title: "Codex finished",
});

test("getPackagedMacNotifierAppPath resolves the bundled helper inside Galactic.app", () => {
  assert.equal(
    getPackagedMacNotifierAppPath("/Applications/Galactic.app/Contents/Resources"),
    "/Applications/Galactic.app/Contents/Library/LoginItems/Galactic Notifier.app",
  );
});

test("getStatus reports packaged-only support in dev", async () => {
  const service = createMacNotifierService({
    isPackaged: false,
    pathExists: () => true,
  });

  const result = await service.getStatus();

  assert.deepEqual(result, {
    authorizationStatus: "unsupported",
    message: "Event notifications are available only in packaged Galactic on macOS.",
    supported: false,
  });
});

test("authorizeNotifications reads the packaged helper result file", async () => {
  const execCalls: Array<{ command: string; args: string[] }> = [];
  const removedPaths: string[] = [];
  const service = createMacNotifierService({
    execFileAsync: async (command, args) => {
      execCalls.push({ command, args });
      return "";
    },
    isPackaged: true,
    makeTempDir: async () => "/tmp/galactic-helper-1",
    pathExists: () => true,
    readFile: async () => JSON.stringify({ authorizationStatus: "authorized" }),
    removePath: async (filePath) => {
      removedPaths.push(filePath);
    },
    resourcesPath: "/Applications/Galactic.app/Contents/Resources",
  });

  const result = await service.authorizeNotifications();

  assert.deepEqual(result, {
    authorizationStatus: "authorized",
    message: undefined,
    success: true,
    supported: true,
  });
  assert.equal(execCalls.length, 1);
  assert.deepEqual(execCalls[0], {
    command: "/usr/bin/open",
    args: [
      "-W",
      "-n",
      "-a",
      "/Applications/Galactic.app/Contents/Library/LoginItems/Galactic Notifier.app",
      "--args",
      "--authorize",
      "--result-file",
      "/tmp/galactic-helper-1/result.json",
    ],
  });
  assert.deepEqual(removedPaths, ["/tmp/galactic-helper-1"]);
});

test("showNotification launches the packaged helper only after status is authorized", async () => {
  const child = new FakeChildProcess();
  const execCalls: Array<{ command: string; args: string[] }> = [];
  let spawnedCommand = "";
  let spawnedArgs: string[] = [];
  const service = createMacNotifierService({
    execFileAsync: async (command, args) => {
      execCalls.push({ command, args });
      return "";
    },
    isPackaged: true,
    makeTempDir: async () => "/tmp/galactic-helper-2",
    pathExists: () => true,
    readFile: async () => JSON.stringify({ authorizationStatus: "authorized" }),
    removePath: async () => {},
    resourcesPath: "/Applications/Galactic.app/Contents/Resources",
    spawnProcess: (command, args) => {
      spawnedCommand = command;
      spawnedArgs = args;
      queueMicrotask(() => child.emit("spawn"));
      return child as unknown as ChildProcess;
    },
  });

  const result = await service.showNotification(createPayload());

  assert.deepEqual(result, { success: true, supported: true });
  assert.equal(execCalls.length, 1);
  assert.equal(spawnedCommand, "/usr/bin/open");
  assert.deepEqual(spawnedArgs.slice(0, 7), [
    "-g",
    "-n",
    "-a",
    "/Applications/Galactic.app/Contents/Library/LoginItems/Galactic Notifier.app",
    "--args",
    "--notify",
    "--payload",
  ]);
  assert.equal(typeof spawnedArgs[7], "string");
  assert.equal(child.unrefCalled, true);
});

test("showNotification returns a blocked result when authorization is denied", async () => {
  const service = createMacNotifierService({
    execFileAsync: async () => "",
    isPackaged: true,
    makeTempDir: async () => "/tmp/galactic-helper-3",
    pathExists: () => true,
    readFile: async () =>
      JSON.stringify({
        authorizationStatus: "denied",
        message: "Notifications are blocked for Galactic in macOS Settings.",
      }),
    removePath: async () => {},
    resourcesPath: "/Applications/Galactic.app/Contents/Resources",
  });

  const result = await service.showNotification(createPayload());

  assert.deepEqual(result, {
    error: "Notifications are blocked for Galactic in macOS Settings.",
    success: false,
    supported: true,
  });
});
