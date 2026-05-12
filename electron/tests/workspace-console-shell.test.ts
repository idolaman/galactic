import assert from "node:assert/strict";
import test from "node:test";
import { resolveWorkspaceConsoleShell } from "../workspace-console/shell.js";

test("resolveWorkspaceConsoleShell uses an existing SHELL on Unix", () => {
  const shell = resolveWorkspaceConsoleShell({
    env: { SHELL: "/custom/shell" },
    pathExists: (path) => path === "/custom/shell",
    platform: "darwin",
  });

  assert.equal(shell, "/custom/shell");
});

test("resolveWorkspaceConsoleShell skips missing Unix shells", () => {
  const shell = resolveWorkspaceConsoleShell({
    env: { SHELL: "/missing/shell" },
    pathExists: (path) => path === "/bin/bash",
    platform: "linux",
  });

  assert.equal(shell, "/bin/bash");
});

test("resolveWorkspaceConsoleShell keeps the Windows shell fallback", () => {
  assert.equal(
    resolveWorkspaceConsoleShell({ env: {}, platform: "win32" }),
    "powershell.exe",
  );
});
