import assert from "node:assert/strict";
import test from "node:test";
import { getQuickLauncherResults } from "../../src/lib/quick-launcher-results.js";
import type { StoredProject } from "../../src/services/projects.js";

const projects: StoredProject[] = [
  {
    id: "project-1",
    isGitRepo: true,
    name: "Galactic",
    path: "/repo/galactic",
    workspaces: [
      { workspace: "/repo/galactic-main", name: "main" },
      { workspace: "/repo/galactic-feature", name: "billing-ui" },
    ],
    worktrees: 2,
  },
  {
    id: "project-2",
    isGitRepo: true,
    name: "Console",
    path: "/repo/console",
    workspaces: [],
    worktrees: 0,
  },
];

test("getQuickLauncherResults reports the empty project state", () => {
  const result = getQuickLauncherResults([], "");

  assert.equal(result.isEmpty, true);
  assert.equal(result.isNoResults, false);
  assert.deepEqual(result.projects, []);
});

test("getQuickLauncherResults reports no results for unmatched search", () => {
  const result = getQuickLauncherResults(projects, "missing");

  assert.equal(result.isEmpty, false);
  assert.equal(result.isNoResults, true);
  assert.deepEqual(result.projects, []);
});

test("getQuickLauncherResults includes root and workspaces when project matches", () => {
  const result = getQuickLauncherResults(projects, "galactic");

  assert.equal(result.projects.length, 1);
  assert.equal(result.projects[0]?.showRoot, true);
  assert.deepEqual(
    result.projects[0]?.workspaces.map((entry) => entry.workspace.name),
    ["main", "billing-ui"],
  );
});

test("getQuickLauncherResults includes only the matched workspace", () => {
  const result = getQuickLauncherResults(projects, "billing");

  assert.equal(result.projects.length, 1);
  assert.equal(result.projects[0]?.showRoot, false);
  assert.deepEqual(
    result.projects[0]?.workspaces.map((entry) => entry.workspace.name),
    ["billing-ui"],
  );
});
