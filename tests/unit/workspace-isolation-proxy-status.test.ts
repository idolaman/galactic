import assert from "node:assert/strict";
import test from "node:test";
import { getWorkspaceIsolationProxySummary } from "../../src/lib/workspace-isolation-proxy-status.js";

test("getWorkspaceIsolationProxySummary describes a running proxy", () => {
  assert.equal(
    getWorkspaceIsolationProxySummary({
      running: true,
      port: 1355,
    }),
    "Proxy running on localhost:1355. Routed workspace domains resolve through Galactic here.",
  );
});

test("getWorkspaceIsolationProxySummary keeps the backend error message for unavailable proxy", () => {
  assert.equal(
    getWorkspaceIsolationProxySummary({
      running: false,
      port: 1355,
      message: "Proxy unavailable. Restart Galactic to restore routed workspace domains.",
    }),
    "Proxy unavailable. Restart Galactic to restore routed workspace domains.",
  );
});
