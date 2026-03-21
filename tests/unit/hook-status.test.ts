import assert from "node:assert/strict";
import test from "node:test";
import { getHookActionLabel, hasHookUpdates, isHookActionDisabled } from "../../src/lib/hook-status.js";

test("getHookActionLabel returns Update for stale hooks", () => {
  assert.equal(getHookActionLabel("update-available", false), "Update");
  assert.equal(getHookActionLabel("update-available", true), "Updating...");
});

test("hasHookUpdates returns true when any hook is stale", () => {
  assert.equal(hasHookUpdates({ claude: "update-available" }), true);
  assert.equal(hasHookUpdates({ claude: "installed" }), false);
});

test("isHookActionDisabled only disables installed or active installs", () => {
  assert.equal(isHookActionDisabled("not-installed", false), false);
  assert.equal(isHookActionDisabled("update-available", false), false);
  assert.equal(isHookActionDisabled("installed", false), true);
  assert.equal(isHookActionDisabled("update-available", true), true);
});
