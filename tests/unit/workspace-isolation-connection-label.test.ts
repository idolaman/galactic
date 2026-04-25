import assert from "node:assert/strict";
import test from "node:test";
import { getWorkspaceIsolationConnectionProofLabel } from "../../src/lib/workspace-isolation-connection-proof-labels.js";

test("getWorkspaceIsolationConnectionProofLabel keeps local targets concise", () => {
  assert.equal(
    getWorkspaceIsolationConnectionProofLabel(
      { projectName: "shop", workspaceRootLabel: "feature/auth" },
      {
        status: "live_target",
        targetName: "web",
        targetProjectName: "shop",
        targetWorkspaceLabel: "feature/auth",
      },
    ),
    "web",
  );
});

test("getWorkspaceIsolationConnectionProofLabel includes project context for external targets", () => {
  assert.equal(
    getWorkspaceIsolationConnectionProofLabel(
      { projectName: "shop", workspaceRootLabel: "feature/auth" },
      {
        status: "configured_target",
        targetName: "api",
        targetProjectName: "payments",
        targetWorkspaceLabel: "feature/payments",
      },
    ),
    "payments / feature/payments / api",
  );
});

test("getWorkspaceIsolationConnectionProofLabel keeps missing targets visible", () => {
  assert.equal(
    getWorkspaceIsolationConnectionProofLabel(
      { projectName: "shop", workspaceRootLabel: "feature/auth" },
      {
        status: "missing_target",
        targetName: "api",
        targetProjectName: "payments",
        targetWorkspaceLabel: "feature/payments",
      },
    ),
    "Missing target",
  );
});
