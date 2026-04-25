import assert from "node:assert/strict";
import test from "node:test";
import { getWorkspaceIsolationStateDescription } from "../../src/lib/workspace-isolation-status-copy.js";

test("getWorkspaceIsolationStateDescription leads with workspace state for ready to activate", () => {
  assert.equal(
    getWorkspaceIsolationStateDescription({
      state: "ready_to_activate",
      reason: null,
      hasDependencies: false,
      hasNonLiveDependencies: false,
    }),
    "Not active in this workspace yet. Project Services is already set up for this project.",
  );
});
