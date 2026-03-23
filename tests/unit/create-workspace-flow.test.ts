import assert from "node:assert/strict";
import test from "node:test";
import {
  canCreateWorkspaceFromNewBranch,
  filterBranchesByQuery,
  normalizeBaseBranch,
  resolveCreateWorkspaceDialogVisibilityChange,
  resolveBranchSelection,
  shouldClearSelectedBaseBranch,
} from "../../src/lib/create-workspace-flow.js";

test("resolveBranchSelection returns existing branch for exact matches", () => {
  const result = resolveBranchSelection("main", ["main", "develop"]);
  assert.deepEqual(result, { kind: "existing", branch: "main" });
});

test("resolveBranchSelection returns a new branch candidate for valid input", () => {
  const result = resolveBranchSelection("feature/new-flow", ["main", "develop"]);
  assert.deepEqual(result, { kind: "new", branch: "feature/new-flow" });
});

test("resolveBranchSelection returns an invalid result for bad branch names", () => {
  const result = resolveBranchSelection("feature new flow", ["main"]);
  assert.deepEqual(result, { kind: "invalid", error: "Branch name is invalid." });
});

test("normalizeBaseBranch trims surrounding whitespace", () => {
  assert.equal(normalizeBaseBranch("  develop  "), "develop");
});

test("filterBranchesByQuery returns all branches for an empty query", () => {
  assert.deepEqual(filterBranchesByQuery(["main", "develop"], "   "), [
    "main",
    "develop",
  ]);
});

test("filterBranchesByQuery matches branches case-insensitively", () => {
  assert.deepEqual(
    filterBranchesByQuery(["main", "Develop", "release"], "dev"),
    ["Develop"],
  );
});

test("filterBranchesByQuery returns no branches when nothing matches", () => {
  assert.deepEqual(filterBranchesByQuery(["main", "develop"], "release"), []);
});

test("shouldClearSelectedBaseBranch returns false for matching normalized values", () => {
  assert.equal(shouldClearSelectedBaseBranch("  develop  ", "develop"), false);
});

test("shouldClearSelectedBaseBranch returns true when input diverges", () => {
  assert.equal(shouldClearSelectedBaseBranch("main", "develop"), true);
});

test("canCreateWorkspaceFromNewBranch rejects missing base branches", () => {
  assert.equal(canCreateWorkspaceFromNewBranch("   ", false), false);
  assert.equal(canCreateWorkspaceFromNewBranch("main", true), false);
  assert.equal(canCreateWorkspaceFromNewBranch("main", false), true);
});

test("resolveCreateWorkspaceDialogVisibilityChange keeps branch results during close", () => {
  assert.deepEqual(resolveCreateWorkspaceDialogVisibilityChange(false), {
    shouldLoadBranches: false,
    shouldResetDialog: false,
  });
});

test("resolveCreateWorkspaceDialogVisibilityChange resets and reloads on open", () => {
  assert.deepEqual(resolveCreateWorkspaceDialogVisibilityChange(true), {
    shouldLoadBranches: true,
    shouldResetDialog: true,
  });
});
