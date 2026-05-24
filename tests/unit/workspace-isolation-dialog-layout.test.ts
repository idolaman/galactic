import assert from "node:assert/strict";
import test from "node:test";
import {
  WORKSPACE_ISOLATION_DIALOG_CONTENT_CLASS_NAME,
  isSingleAppOverviewStep,
} from "../../src/lib/workspace-isolation-dialog-layout.js";
import {
  getWorkspaceIsolationDialogStepId,
  getWorkspaceIsolationDialogSteps,
} from "../../src/lib/workspace-isolation-dialog-steps.js";
import { getWorkspaceIsolationDraftServiceIssues } from "../../src/lib/workspace-isolation-dialog-service-issues.js";

test("workspace isolation dialog uses the reduced bounded height", () => {
  assert.match(WORKSPACE_ISOLATION_DIALOG_CONTENT_CLASS_NAME, /h-\[78vh\]/);
  assert.match(WORKSPACE_ISOLATION_DIALOG_CONTENT_CLASS_NAME, /max-h-\[42rem\]/);
});

test("isSingleAppOverviewStep only stretches the single-app service step", () => {
  assert.equal(isSingleAppOverviewStep(1, "single-app"), false);
  assert.equal(isSingleAppOverviewStep(3, "single-app"), true);
  assert.equal(isSingleAppOverviewStep(3, "monorepo"), false);
});

test("workspace isolation dialog step indicator stays stable after setup steps", () => {
  assert.deepEqual(
    getWorkspaceIsolationDialogSteps(3, false).map((step) => step.label),
    ["Services", "Connections", "Activate"],
  );
  assert.deepEqual(
    getWorkspaceIsolationDialogSteps(3, true).map((step) => step.label),
    ["Intro", "Terminal", "Services", "Connections", "Activate"],
  );
  assert.equal(getWorkspaceIsolationDialogStepId(4), "4");
});

test("workspace isolation draft service issues catch missing and duplicate folders", () => {
  const issues = getWorkspaceIsolationDraftServiceIssues("monorepo", [
    { id: "web", name: "Web", slug: "web", relativePath: "", port: 4310, createdAt: 1, connections: [] },
    { id: "api", name: "API", slug: "api", relativePath: "apps/api", port: 4311, createdAt: 1, connections: [] },
    { id: "api-2", name: "API 2", slug: "api-2", relativePath: "apps/api", port: 4312, createdAt: 1, connections: [] },
  ]);

  assert.equal(issues.web, "Enter a relative folder like apps/web.");
  assert.equal(issues.api, "Each service needs a unique folder.");
  assert.equal(issues["api-2"], "Each service needs a unique folder.");
  assert.deepEqual(getWorkspaceIsolationDraftServiceIssues("single-app", []), {});
});
