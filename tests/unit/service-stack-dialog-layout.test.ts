import assert from "node:assert/strict";
import test from "node:test";
import {
  SERVICE_STACK_DIALOG_CONTENT_CLASS_NAME,
  isSingleAppOverviewStep,
} from "../../src/lib/service-stack-dialog-layout.js";

test("service stack dialog uses the reduced bounded height", () => {
  assert.match(SERVICE_STACK_DIALOG_CONTENT_CLASS_NAME, /h-\[78vh\]/);
  assert.match(SERVICE_STACK_DIALOG_CONTENT_CLASS_NAME, /max-h-\[42rem\]/);
});

test("isSingleAppOverviewStep only stretches the single-app first step", () => {
  assert.equal(isSingleAppOverviewStep(1, "single-app"), true);
  assert.equal(isSingleAppOverviewStep(2, "single-app"), false);
  assert.equal(isSingleAppOverviewStep(1, "monorepo"), false);
});
