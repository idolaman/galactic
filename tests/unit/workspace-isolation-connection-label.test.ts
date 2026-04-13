import assert from "node:assert/strict";
import test from "node:test";
import { getWorkspaceIsolationConnectionLabel } from "../../src/lib/workspace-isolation.js";

test("getWorkspaceIsolationConnectionLabel keeps local targets concise", () => {
  assert.equal(
    getWorkspaceIsolationConnectionLabel(
      { projectName: "shop", workspaceRootLabel: "feature/auth" },
      {
        isMissing: false,
        targetName: "web",
        targetProjectName: "shop",
        targetWorkspaceLabel: "feature/auth",
      },
    ),
    "web",
  );
});

test("getWorkspaceIsolationConnectionLabel includes project context for external targets", () => {
  assert.equal(
    getWorkspaceIsolationConnectionLabel(
      { projectName: "shop", workspaceRootLabel: "feature/auth" },
      {
        isMissing: false,
        targetName: "api",
        targetProjectName: "payments",
        targetWorkspaceLabel: "feature/payments",
      },
    ),
    "payments / feature/payments / api",
  );
});

test("getWorkspaceIsolationConnectionLabel keeps missing targets visible", () => {
  assert.equal(
    getWorkspaceIsolationConnectionLabel(
      { projectName: "shop", workspaceRootLabel: "feature/auth" },
      {
        isMissing: true,
        targetName: "api",
        targetProjectName: "payments",
        targetWorkspaceLabel: "feature/payments",
      },
    ),
    "Missing target",
  );
});
