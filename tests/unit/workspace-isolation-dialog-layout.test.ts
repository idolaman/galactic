import assert from "node:assert/strict";
import test from "node:test";
import {
  WORKSPACE_ISOLATION_DIALOG_CONTENT_CLASS_NAME,
  isSingleAppOverviewStep,
} from "../../src/lib/workspace-isolation-dialog-layout.js";

test("workspace isolation dialog uses the reduced bounded height", () => {
  assert.match(WORKSPACE_ISOLATION_DIALOG_CONTENT_CLASS_NAME, /h-\[78vh\]/);
  assert.match(WORKSPACE_ISOLATION_DIALOG_CONTENT_CLASS_NAME, /max-h-\[42rem\]/);
});

test("isSingleAppOverviewStep only stretches the single-app service step", () => {
  assert.equal(isSingleAppOverviewStep(1, "single-app"), false);
  assert.equal(isSingleAppOverviewStep(3, "single-app"), true);
  assert.equal(isSingleAppOverviewStep(3, "monorepo"), false);
});
