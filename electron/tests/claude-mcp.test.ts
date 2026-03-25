import assert from "node:assert/strict";
import test from "node:test";
import {
  CLAUDE_MCP_ADD_ARGS,
  CLAUDE_MCP_GET_ARGS,
  checkClaudeMcpInstalled,
  installClaudeMcp,
} from "../utils/claude-mcp.js";

test("checkClaudeMcpInstalled returns true when Claude Code reports the server", async () => {
  const calls: string[][] = [];
  const installed = await checkClaudeMcpInstalled(async (args) => {
    calls.push(args);
    return { stdout: "Status: Failed to connect" };
  });

  assert.equal(installed, true);
  assert.deepEqual(calls, [[...CLAUDE_MCP_GET_ARGS]]);
});

test("checkClaudeMcpInstalled returns false when the server is missing", async () => {
  const installed = await checkClaudeMcpInstalled(async () => {
    const error = Object.assign(new Error("missing"), { code: 1, stdout: "No MCP server found with name: galactic" });
    throw error;
  });

  assert.equal(installed, false);
});

test("installClaudeMcp skips add when the server is already present", async () => {
  const calls: string[][] = [];
  const result = await installClaudeMcp(async (args) => {
    calls.push(args);
    return { stdout: "galactic" };
  });

  assert.deepEqual(result, { success: true });
  assert.deepEqual(calls, [[...CLAUDE_MCP_GET_ARGS]]);
});

test("installClaudeMcp runs the exact add command after a missing-server check", async () => {
  const calls: string[][] = [];
  const result = await installClaudeMcp(async (args) => {
    calls.push(args);
    if (calls.length === 1) {
      const error = Object.assign(new Error("missing"), { code: 1, stdout: "No MCP server found with name: galactic" });
      throw error;
    }

    return { stdout: "added" };
  });

  assert.deepEqual(result, { success: true });
  assert.deepEqual(calls, [[...CLAUDE_MCP_GET_ARGS], [...CLAUDE_MCP_ADD_ARGS]]);
});

test("installClaudeMcp returns the CLI error when add fails", async () => {
  const result = await installClaudeMcp(async (args) => {
    if (args[1] === "get") {
      const error = Object.assign(new Error("missing"), { code: 1, stdout: "No MCP server found with name: galactic" });
      throw error;
    }

    throw new Error("spawn claude ENOENT");
  });

  assert.deepEqual(result, { success: false, error: "spawn claude ENOENT" });
});
