import assert from "node:assert/strict";
import test from "node:test";
import { getLegacyLocalEnvironmentSummary } from "../../src/lib/workspace-networking.js";

test("getLegacyLocalEnvironmentSummary shows the configured legacy environment", () => {
  assert.equal(
    getLegacyLocalEnvironmentSummary("Checkout"),
    "Using Checkout",
  );
});

test("getLegacyLocalEnvironmentSummary shows the empty legacy state", () => {
  assert.equal(
    getLegacyLocalEnvironmentSummary(null),
    null,
  );
});
