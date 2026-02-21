import assert from "node:assert/strict";
import test from "node:test";
import {
  classifyFetchError,
  fetchGitBranchesWithReason,
} from "../utils/git-fetch-branches.js";

test("classifyFetchError identifies auth-cancelled errors", () => {
  const reason = classifyFetchError("fatal: could not read Username for 'https://github.com': Device not configured");
  assert.equal(reason, "auth-cancelled");
});

test("classifyFetchError identifies auth-required errors", () => {
  const reason = classifyFetchError("remote: Authentication failed for 'https://github.com/org/repo.git/'");
  assert.equal(reason, "auth-required");
});

test("classifyFetchError identifies network errors", () => {
  const reason = classifyFetchError("fatal: unable to access 'https://github.com/': Could not resolve host: github.com");
  assert.equal(reason, "network");
});

test("classifyFetchError falls back to unknown for unmatched errors", () => {
  const reason = classifyFetchError("fatal: unexpected git failure");
  assert.equal(reason, "unknown");
});

test("fetchGitBranchesWithReason returns reasoned failure result", async () => {
  const result = await fetchGitBranchesWithReason("/repo", async () => {
    const error = Object.assign(new Error("command failed"), {
      stderr: "fatal: could not read Username for 'https://github.com': Device not configured",
    });
    throw error;
  });

  assert.equal(result.success, false);
  assert.equal(result.reason, "auth-cancelled");
  assert.equal(typeof result.error, "string");
});
