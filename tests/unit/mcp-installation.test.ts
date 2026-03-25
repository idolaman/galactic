import assert from "node:assert/strict";
import test from "node:test";
import { handleMcpInstallResult, MCP_INSTALL_NOTE } from "../../src/lib/mcp-installation.js";

test("handleMcpInstallResult refreshes status without toasting on success", async () => {
  let refreshCalls = 0;
  let toastCalls = 0;

  await handleMcpInstallResult({
    result: { success: true },
    refreshStatus: async () => {
      refreshCalls += 1;
    },
    toast: () => {
      toastCalls += 1;
    },
    tool: "Claude",
  });

  assert.equal(refreshCalls, 1);
  assert.equal(toastCalls, 0);
});

test("handleMcpInstallResult toasts and skips refresh on failure", async () => {
  let refreshCalls = 0;
  let toastPayload = null;

  await handleMcpInstallResult({
    result: { success: false, error: "boom" },
    refreshStatus: async () => {
      refreshCalls += 1;
    },
    toast: (options) => {
      toastPayload = options;
    },
    tool: "Codex",
  });

  assert.equal(refreshCalls, 0);
  assert.deepEqual(toastPayload, {
    title: "Installation Failed",
    description: "boom",
    variant: "destructive",
  });
});

test("MCP_INSTALL_NOTE tells users to restart their coding agent without relaunching workspaces", () => {
  assert.equal(
    MCP_INSTALL_NOTE,
    "After installing Galactic MCP, restart your coding agent so it can load the new connection.",
  );
});
