import assert from "node:assert/strict";
import test from "node:test";
import {
  canCreateWorkspaceFromExistingBranch,
  canCreateWorkspaceFromNewBranch,
  filterBranchesByQuery,
  normalizeBaseBranch,
  orderBaseBranchCandidates,
  resolveCreateWorkspaceDialogVisibilityChange,
  resolveBranchSelection,
  shouldClearSelectedBaseBranch,
  shouldClearSelectedWorkspaceBranch,
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

test("orderBaseBranchCandidates promotes preferred branches in order", () => {
  assert.deepEqual(
    orderBaseBranchCandidates(["feature/a", "master", "dev", "release", "main"]),
    ["dev", "main", "master", "feature/a", "release"],
  );
});

test("orderBaseBranchCandidates skips missing preferred branches", () => {
  assert.deepEqual(orderBaseBranchCandidates(["release", "master", "feature/a"]), [
    "master",
    "release",
    "feature/a",
  ]);
});

test("orderBaseBranchCandidates keeps non-preferred branches in git order", () => {
  assert.deepEqual(orderBaseBranchCandidates(["feature/b", "release", "hotfix"]), [
    "feature/b",
    "release",
    "hotfix",
  ]);
});

test("orderBaseBranchCandidates only promotes exact case-sensitive matches", () => {
  assert.deepEqual(
    orderBaseBranchCandidates(["develop", "main-fix", "Dev", "feature/a", "main"]),
    ["main", "develop", "main-fix", "Dev", "feature/a"],
  );
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

test("canCreateWorkspaceFromExistingBranch requires an armed branch", () => {
  assert.equal(canCreateWorkspaceFromExistingBranch("", false), false);
  assert.equal(canCreateWorkspaceFromExistingBranch("main", true), false);
  assert.equal(canCreateWorkspaceFromExistingBranch("main", false), true);
});

test("shouldClearSelectedWorkspaceBranch follows normalized input", () => {
  assert.equal(shouldClearSelectedWorkspaceBranch(" main ", "main"), false);
  assert.equal(shouldClearSelectedWorkspaceBranch("develop", "main"), true);
  assert.equal(shouldClearSelectedWorkspaceBranch("develop", ""), false);
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
