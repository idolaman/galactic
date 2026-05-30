import assert from "node:assert/strict";
import test from "node:test";

import { buildAuthAnalyticsPayload } from "../../src/lib/auth-analytics.js";

test("buildAuthAnalyticsPayload includes only provider and coarse failure reason", () => {
  assert.deepEqual(buildAuthAnalyticsPayload("github", "exchange_failed"), {
    provider: "github",
    reason: "exchange_failed",
  });
});

test("buildAuthAnalyticsPayload omits undefined properties", () => {
  assert.deepEqual(buildAuthAnalyticsPayload(undefined, "invalid_state"), {
    reason: "invalid_state",
  });
});
