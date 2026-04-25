import assert from "node:assert/strict";
import test from "node:test";
import { resolveSelectedEnvironmentId } from "../../src/lib/environment-selection.js";

const environments = [{ id: "env-1" }, { id: "env-2" }];

test("resolveSelectedEnvironmentId selects the first environment after hydration", () => {
  assert.equal(resolveSelectedEnvironmentId(null, environments), "env-1");
});

test("resolveSelectedEnvironmentId keeps an existing selected environment", () => {
  assert.equal(resolveSelectedEnvironmentId("env-2", environments), "env-2");
});

test("resolveSelectedEnvironmentId falls back when the selected environment is gone", () => {
  assert.equal(resolveSelectedEnvironmentId("missing", environments), "env-1");
});

test("resolveSelectedEnvironmentId clears selection when no environments exist", () => {
  assert.equal(resolveSelectedEnvironmentId("env-1", []), null);
});
