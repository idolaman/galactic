import assert from "node:assert/strict";
import test from "node:test";
import {
  applyToastDefaults,
  DEFAULT_ERROR_TOAST_DURATION,
} from "../../src/lib/toast-defaults.js";

test("applyToastDefaults adds the standard duration to destructive toasts", () => {
  assert.deepEqual(
    applyToastDefaults({
      title: "Failed to create workspace",
      variant: "destructive" as const,
    }),
    {
      title: "Failed to create workspace",
      variant: "destructive",
      duration: DEFAULT_ERROR_TOAST_DURATION,
    },
  );
});

test("applyToastDefaults preserves an explicit destructive duration override", () => {
  assert.deepEqual(
    applyToastDefaults({
      title: "Update failed",
      variant: "destructive" as const,
      duration: 8000,
    }),
    {
      title: "Update failed",
      variant: "destructive",
      duration: 8000,
    },
  );
});

test("applyToastDefaults leaves non-destructive toasts unchanged", () => {
  assert.deepEqual(
    applyToastDefaults({
      title: "Workspace created",
      variant: "default" as const,
    }),
    {
      title: "Workspace created",
      variant: "default",
    },
  );
});
