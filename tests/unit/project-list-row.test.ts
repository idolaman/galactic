import assert from "node:assert/strict";
import test from "node:test";

import { shouldActivateProjectListRowFromKey } from "../../src/lib/project-list-row.js";

test("project row keyboard activation only accepts row-target Enter and Space", () => {
  assert.equal(shouldActivateProjectListRowFromKey("Enter", true), true);
  assert.equal(shouldActivateProjectListRowFromKey(" ", true), true);
  assert.equal(shouldActivateProjectListRowFromKey("Escape", true), false);
});

test("project row keyboard activation ignores nested control events", () => {
  assert.equal(shouldActivateProjectListRowFromKey("Enter", false), false);
  assert.equal(shouldActivateProjectListRowFromKey(" ", false), false);
});
