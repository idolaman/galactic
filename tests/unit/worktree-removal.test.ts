import assert from "node:assert/strict";
import test from "node:test";
import {
  evaluateWorktreeRemovalResult,
  getWorktreeRemovalFailureToast,
  getWorktreeRemovalLoadingToast,
} from "../../src/lib/worktree-removal.js";

test("evaluateWorktreeRemovalResult cleans up on normal success", () => {
  const result = evaluateWorktreeRemovalResult({ success: true });
  assert.equal(result.shouldCleanup, true);
});

test("evaluateWorktreeRemovalResult cleans up when workspace is already removed in git", () => {
  const result = evaluateWorktreeRemovalResult({ success: true, alreadyRemoved: true });
  assert.equal(result.shouldCleanup, true);
});

test("evaluateWorktreeRemovalResult blocks cleanup on failure", () => {
  const result = evaluateWorktreeRemovalResult({ success: false, alreadyRemoved: true });
  assert.equal(result.shouldCleanup, false);
});

test("getWorktreeRemovalFailureToast returns the git error message when available", () => {
  const toast = getWorktreeRemovalFailureToast(
    " fatal: '/tmp/worktree' contains modified or untracked files, use --force to delete it\n",
  );
  assert.equal(toast.kind, "error");
  assert.equal(toast.title, "Could not remove workspace");
  assert.equal(
    toast.description,
    "fatal: '/tmp/worktree' contains modified or untracked files, use --force to delete it",
  );
});

test("getWorktreeRemovalFailureToast falls back when the git error is blank", () => {
  const toast = getWorktreeRemovalFailureToast("   ");
  assert.equal(toast.description, "Please try again.");
});

test("getWorktreeRemovalLoadingToast returns progress copy", () => {
  const toast = getWorktreeRemovalLoadingToast();
  assert.equal(toast.title, "Removing workspace...");
});
