import assert from "node:assert/strict";
import test from "node:test";
import { getGitCurrentBranch } from "../utils/git-current-branch.js";

test("getGitCurrentBranch returns branch name when available", async () => {
  const result = await getGitCurrentBranch("/repo", async () => ({ stdout: "feature/current\n" }));
  assert.deepEqual(result, { success: true, branch: "feature/current" });
});

test("getGitCurrentBranch fails when branch is empty", async () => {
  const result = await getGitCurrentBranch("/repo", async () => ({ stdout: "\n" }));
  assert.equal(result.success, false);
  assert.equal(result.error, "No current branch found in project root.");
});

test("getGitCurrentBranch surfaces git errors", async () => {
  const result = await getGitCurrentBranch("/repo", async () => {
    const error = Object.assign(new Error("command failed"), { stderr: "fatal: not a git repository" });
    throw error;
  });
  assert.equal(result.success, false);
  assert.equal(result.error, "fatal: not a git repository");
});
