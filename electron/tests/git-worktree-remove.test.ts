import assert from "node:assert/strict";
import test from "node:test";
import { isWorktreeAlreadyRemovedError } from "../utils/git-worktree-remove.js";

test("isWorktreeAlreadyRemovedError identifies stale worktree message", () => {
  const isStale = isWorktreeAlreadyRemovedError("fatal: '/tmp/worktree' is not a working tree");
  assert.equal(isStale, true);
});

test("isWorktreeAlreadyRemovedError is case insensitive", () => {
  const isStale = isWorktreeAlreadyRemovedError("FATAL: '/tmp/worktree' is NOT A WORKING TREE");
  assert.equal(isStale, true);
});

test("isWorktreeAlreadyRemovedError ignores other git failures", () => {
  const isStale = isWorktreeAlreadyRemovedError("fatal: unable to access remote repository");
  assert.equal(isStale, false);
});
