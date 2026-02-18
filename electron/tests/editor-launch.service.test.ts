import assert from "node:assert/strict";
import test from "node:test";
import {
  createEditorLaunchService,
  getFriendlyEditorLaunchError,
  parseEditorName,
} from "../editor-launch/service.js";

interface ExecCall {
  command: string;
  args: string[];
}

test("parseEditorName accepts supported editor names", () => {
  assert.equal(parseEditorName("Cursor"), "Cursor");
  assert.equal(parseEditorName("VSCode"), "VSCode");
  assert.equal(parseEditorName("Unknown"), null);
});

test("checkEditorInstalled uses macOS bundle path when available", async () => {
  const execCalls: ExecCall[] = [];
  const service = createEditorLaunchService({
    platform: "darwin",
    homeDirectory: "/Users/tester",
    pathExists: (filePath) => filePath.endsWith("Cursor.app"),
    execFileAsync: async (command, args) => {
      execCalls.push({ command, args });
      throw new Error("Unexpected command lookup.");
    },
  });

  const result = await service.checkEditorInstalled("Cursor");
  assert.equal(result, true);
  assert.equal(execCalls.length, 0);
});

test("openProject falls back to VSCode when Cursor is unavailable", async () => {
  const execCalls: ExecCall[] = [];
  const service = createEditorLaunchService({
    platform: "darwin",
    homeDirectory: "/Users/tester",
    pathExists: (filePath) => filePath.endsWith("Visual Studio Code.app"),
    execFileAsync: async (command, args) => {
      execCalls.push({ command, args });
      if (command === "which") {
        throw new Error("Command not found.");
      }
      return "";
    },
    logError: () => {},
  });

  const result = await service.openProject("Cursor", "/tmp/project");
  assert.deepEqual(result, {
    success: true,
    usedEditor: "VSCode",
    fallbackApplied: true,
  });
  assert.equal(
    execCalls.some((call) => {
      return (
        call.command === "open"
        && call.args[0] === "-a"
        && call.args[1] === "Visual Studio Code"
        && call.args[2] === "/tmp/project"
      );
    }),
    true,
  );
});

test("openProject returns a helpful error when no supported editor is installed", async () => {
  const service = createEditorLaunchService({
    platform: "darwin",
    pathExists: () => false,
    execFileAsync: async () => {
      throw new Error("Command not found.");
    },
  });

  const result = await service.openProject("VSCode", "/tmp/project");
  assert.equal(result.success, false);
  assert.equal(
    result.error,
    "No supported editor installation found. Install Cursor or Visual Studio Code.",
  );
});

test("openProject maps launch errors to friendly messages", async () => {
  const service = createEditorLaunchService({
    platform: "darwin",
    pathExists: (filePath) => filePath.endsWith("Cursor.app"),
    execFileAsync: async (command, args) => {
      if (command === "which") {
        throw new Error(`Missing command: ${args[0] ?? "unknown"}`);
      }
      if (command === "open") {
        throw new Error("Unable to find application named 'Cursor'");
      }
      return "";
    },
    logError: () => {},
  });

  const result = await service.openProject("Cursor", "/tmp/project");
  assert.equal(result.success, false);
  assert.equal(result.error, "Cursor is not installed on this machine.");
});

test("getFriendlyEditorLaunchError handles command launcher failures", () => {
  assert.equal(
    getFriendlyEditorLaunchError("VSCode", new Error("spawn code ENOENT")),
    "VSCode command launcher is unavailable.",
  );
});
