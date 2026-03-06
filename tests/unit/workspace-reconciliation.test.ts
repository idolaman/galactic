import assert from "node:assert/strict";
import test from "node:test";
import {
  reconcileProjectWorkspaces,
  toAdditionalWorkspaces,
} from "../../src/lib/workspace-reconciliation.js";

test("toAdditionalWorkspaces filters repository root entry", () => {
  const workspaces = toAdditionalWorkspaces("/repo", [
    { path: "/repo", branch: "main" },
    { path: "/repo/.worktrees/feature-a", branch: "feature-a" },
  ]);

  assert.deepEqual(workspaces, [{ name: "feature-a", workspace: "/repo/.worktrees/feature-a" }]);
});

test("reconcileProjectWorkspaces keeps reference when no changes are needed", () => {
  const project = {
    id: "/repo",
    path: "/repo",
    worktrees: 1,
    workspaces: [{ name: "feature-a", workspace: "/repo/.worktrees/feature-a" }],
  };

  const reconciled = reconcileProjectWorkspaces(project, [
    { path: "/repo/", branch: "main" },
    { path: "/repo/.worktrees/feature-a", branch: "feature-a" },
  ]);

  assert.equal(reconciled, project);
});

test("reconcileProjectWorkspaces removes stale workspaces and updates count", () => {
  const project = {
    id: "/repo",
    path: "/repo",
    worktrees: 2,
    workspaces: [
      { name: "feature-a", workspace: "/repo/.worktrees/feature-a" },
      { name: "feature-b", workspace: "/repo/.worktrees/feature-b" },
    ],
  };

  const reconciled = reconcileProjectWorkspaces(project, [
    { path: "/repo", branch: "main" },
    { path: "/repo/.worktrees/feature-b", branch: "feature-b" },
  ]);

  assert.notEqual(reconciled, project);
  assert.equal(reconciled.worktrees, 1);
  assert.deepEqual(reconciled.workspaces, [{ name: "feature-b", workspace: "/repo/.worktrees/feature-b" }]);
});

test("reconcileProjectWorkspaces clears stale entries when git returns no extra worktrees", () => {
  const project = {
    id: "/repo",
    path: "/repo",
    worktrees: 1,
    workspaces: [{ name: "feature-a", workspace: "/repo/.worktrees/feature-a" }],
  };

  const reconciled = reconcileProjectWorkspaces(project, [{ path: "/repo", branch: "main" }]);

  assert.equal(reconciled.worktrees, 0);
  assert.deepEqual(reconciled.workspaces, []);
});
