import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_CREATE_WORKSPACE_COMMAND_ERROR,
  DEFAULT_CREATE_WORKSPACE_UNKNOWN_ERROR,
  getCreateWorkspaceFailureToast,
} from "../../src/lib/create-workspace-toast.js";

test("getCreateWorkspaceFailureToast returns the standard error toast", () => {
  const toast = getCreateWorkspaceFailureToast({
    errorMessage: "branch already exists",
    fallbackDescription: DEFAULT_CREATE_WORKSPACE_COMMAND_ERROR,
  });

  assert.deepEqual(toast, {
    kind: "error",
    title: "Failed to create workspace",
    description: "branch already exists",
  });
});

test("getCreateWorkspaceFailureToast falls back to the git command copy", () => {
  const toast = getCreateWorkspaceFailureToast({
    errorMessage: "   ",
    fallbackDescription: DEFAULT_CREATE_WORKSPACE_COMMAND_ERROR,
  });

  assert.equal(toast.description, DEFAULT_CREATE_WORKSPACE_COMMAND_ERROR);
});

test("getCreateWorkspaceFailureToast falls back to the unexpected error copy", () => {
  const toast = getCreateWorkspaceFailureToast({
    fallbackDescription: DEFAULT_CREATE_WORKSPACE_UNKNOWN_ERROR,
  });

  assert.equal(toast.description, DEFAULT_CREATE_WORKSPACE_UNKNOWN_ERROR);
});
