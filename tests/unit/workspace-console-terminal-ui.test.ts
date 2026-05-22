import assert from "node:assert/strict";
import test from "node:test";
import {
  getWorkspaceConsoleSessionCountLabel,
  getWorkspaceConsoleStatusLabel,
  shouldResizeWorkspaceConsoleTerminal,
} from "../../src/lib/workspace-console.js";

test("workspace console labels terminal session counts and statuses", () => {
  assert.equal(getWorkspaceConsoleSessionCountLabel(0), "0 sessions");
  assert.equal(getWorkspaceConsoleSessionCountLabel(1), "1 session");
  assert.equal(getWorkspaceConsoleSessionCountLabel(2), "2 sessions");
  assert.equal(getWorkspaceConsoleStatusLabel("starting"), "Starting");
  assert.equal(getWorkspaceConsoleStatusLabel("running"), "Running");
  assert.equal(getWorkspaceConsoleStatusLabel("exited"), "Exited");
  assert.equal(getWorkspaceConsoleStatusLabel("error"), "Error");
});

test("workspace console terminal resize guard skips duplicate and invalid sizes", () => {
  assert.equal(
    shouldResizeWorkspaceConsoleTerminal(null, { cols: 80, rows: 24 }),
    true,
  );
  assert.equal(
    shouldResizeWorkspaceConsoleTerminal(
      { cols: 80, rows: 24 },
      { cols: 80, rows: 24 },
    ),
    false,
  );
  assert.equal(
    shouldResizeWorkspaceConsoleTerminal(
      { cols: 80, rows: 24 },
      { cols: 120, rows: 32 },
    ),
    true,
  );
  assert.equal(
    shouldResizeWorkspaceConsoleTerminal(null, { cols: 0, rows: 24 }),
    false,
  );
});
