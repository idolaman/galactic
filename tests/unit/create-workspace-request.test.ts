import assert from "node:assert/strict";
import test from "node:test";
import { normalizeBranchName, validateNewBranchName } from "../../src/lib/create-workspace-request.js";

test("normalizeBranchName trims surrounding spaces", () => {
  assert.equal(normalizeBranchName("  feature/abc  "), "feature/abc");
});

test("validateNewBranchName accepts a new valid branch", () => {
  const result = validateNewBranchName("feature/new-flow", ["main", "develop"]);
  assert.equal(result.isValid, true);
  assert.equal(result.normalizedBranch, "feature/new-flow");
  assert.equal(result.error, undefined);
});

test("validateNewBranchName rejects duplicate branch names", () => {
  const result = validateNewBranchName("feature/new-flow", ["main", "feature/new-flow"]);
  assert.equal(result.isValid, false);
  assert.equal(result.error, "Branch already exists.");
});

test("validateNewBranchName rejects invalid branch characters", () => {
  const result = validateNewBranchName("feature/new flow", []);
  assert.equal(result.isValid, false);
  assert.equal(result.error, "Branch name is invalid.");
});

test("validateNewBranchName rejects empty input", () => {
  const result = validateNewBranchName("   ", []);
  assert.equal(result.isValid, false);
  assert.equal(result.error, "Branch name is required.");
});
