import assert from "node:assert/strict";
import test from "node:test";
import {
  createWorkspaceActivationTargets,
  getInitialWorkspaceActivationTargetPath,
  getSelectableWorkspaceActivationTargets,
  getWorkspaceActivationButtonLabel,
  getWorkspaceActivationTarget,
  shouldOfferWorkspaceActivation,
} from "../../src/lib/workspace-isolation-activation.js";

test("workspace activation targets keep repository root first and preserve workspace order", () => {
  const targets = createWorkspaceActivationTargets({
    workspaceRootPath: "/repo",
    workspaceRootLabel: "Repository Root",
    workspaces: [
      { name: "feature/auth", workspace: "/repo-auth" },
      { name: "feature/payments", workspace: "/repo-payments" },
    ],
    workspaceIsolationStacks: [],
  });

  assert.deepEqual(
    targets.map(({ label, path, kind }) => ({ label, path, kind })),
    [
      {
        label: "Repository Root",
        path: "/repo",
        kind: "base",
      },
      {
        label: "feature/auth",
        path: "/repo-auth",
        kind: "workspace",
      },
      {
        label: "feature/payments",
        path: "/repo-payments",
        kind: "workspace",
      },
    ],
  );
});

test("workspace activation helpers filter active workspaces and default to the first eligible target", () => {
  const targets = createWorkspaceActivationTargets({
    workspaceRootPath: "/repo",
    workspaceRootLabel: "Repository Root",
    workspaces: [
      { name: "feature/auth", workspace: "/repo-auth" },
      { name: "feature/payments", workspace: "/repo-payments" },
    ],
    workspaceIsolationStacks: [
      { workspaceRootPath: "/repo" },
      { workspaceRootPath: "/repo-payments" },
    ],
  });

  assert.deepEqual(
    getSelectableWorkspaceActivationTargets(targets).map((target) => target.label),
    ["feature/auth"],
  );
  assert.equal(getInitialWorkspaceActivationTargetPath(targets), "/repo-auth");
  assert.equal(
    getWorkspaceActivationTarget(targets, "/repo-auth")?.label,
    "feature/auth",
  );
});

test("workspace activation offer logic only applies to first-time setup when an eligible workspace exists", () => {
  const targets = createWorkspaceActivationTargets({
    workspaceRootPath: "/repo",
    workspaceRootLabel: "Repository Root",
    workspaces: [{ name: "feature/auth", workspace: "/repo-auth" }],
    workspaceIsolationStacks: [],
  });
  const activeTargets = createWorkspaceActivationTargets({
    workspaceRootPath: "/repo",
    workspaceRootLabel: "Repository Root",
    workspaces: [{ name: "feature/auth", workspace: "/repo-auth" }],
    workspaceIsolationStacks: [
      { workspaceRootPath: "/repo" },
      { workspaceRootPath: "/repo-auth" },
    ],
  });

  assert.equal(shouldOfferWorkspaceActivation(false, targets), true);
  assert.equal(shouldOfferWorkspaceActivation(true, targets), false);
  assert.equal(shouldOfferWorkspaceActivation(false, activeTargets), false);
});

test("workspace activation button label includes the selected workspace name", () => {
  assert.equal(
    getWorkspaceActivationButtonLabel("Repository Root"),
    "Activate for Repository Root",
  );
  assert.equal(
    getWorkspaceActivationButtonLabel("feature/auth"),
    "Activate for feature/auth",
  );
});
