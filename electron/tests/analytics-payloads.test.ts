import assert from "node:assert/strict";
import test from "node:test";

import {
  buildPostHogProperties,
  buildTelemetryDeckPayload,
} from "../analytics-payloads.js";

const context = {
  appVersion: "1.0.28",
  platform: "darwin" as const,
};

test("PostHog properties keep product fields and strip sensitive fields", () => {
  const properties = buildPostHogProperties("Error.gitFailed", {
    address: "127.0.0.1",
    branch: "feature/private-ticket",
    error: "fatal: private repo path /Users/tester/project",
    isGitRepo: true,
    operation: "fetch",
    pathHint: "customer-repo",
    worktrees: 3,
  }, context);

  assert.deepEqual(properties, {
    appVersion: "1.0.28",
    isGitRepo: true,
    operation: "fetch",
    platform: "darwin",
    worktrees: 3,
  });
});

test("TelemetryDeck payload preserves existing stringified payload behavior", () => {
  const payload = buildTelemetryDeckPayload({
    success: false,
    worktrees: 2,
  }, context);

  assert.deepEqual(payload, {
    appVersion: "1.0.28",
    platform: "darwin",
    success: "false",
    worktrees: "2",
  });
});
