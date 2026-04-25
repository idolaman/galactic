import assert from "node:assert/strict";
import test from "node:test";
import { getWorkspaceIsolationServicesOpenState } from "../../src/lib/workspace-networking-panel.js";

test("getWorkspaceIsolationServicesOpenState preserves the current state for the same stack", () => {
  assert.equal(getWorkspaceIsolationServicesOpenState("stack-1", "stack-1", true), true);
  assert.equal(getWorkspaceIsolationServicesOpenState("stack-1", "stack-1", false), false);
});

test("getWorkspaceIsolationServicesOpenState closes when a stack is first created", () => {
  assert.equal(getWorkspaceIsolationServicesOpenState(null, "stack-1", true), false);
});

test("getWorkspaceIsolationServicesOpenState closes when a stack is removed", () => {
  assert.equal(getWorkspaceIsolationServicesOpenState("stack-1", null, true), false);
});

test("getWorkspaceIsolationServicesOpenState closes when the panel switches to another stack", () => {
  assert.equal(getWorkspaceIsolationServicesOpenState("stack-1", "stack-2", true), false);
});
