import assert from "node:assert/strict";
import test from "node:test";

import {
  canStartSessionRecording,
  normalizeSessionRecordingConfig,
} from "../../src/services/session-recording-state.js";

test("normalizeSessionRecordingConfig trims usable config", () => {
  assert.deepEqual(
    normalizeSessionRecordingConfig({
      enabled: true,
      host: " https://us.i.posthog.com ",
      projectKey: " phc_test ",
    }),
    {
      enabled: true,
      host: "https://us.i.posthog.com",
      projectKey: "phc_test",
    },
  );
});

test("normalizeSessionRecordingConfig disables missing project details", () => {
  assert.deepEqual(
    normalizeSessionRecordingConfig({
      enabled: true,
      host: "https://us.i.posthog.com",
      projectKey: "",
    }),
    {
      enabled: false,
      host: "https://us.i.posthog.com",
      projectKey: "",
    },
  );
});

test("canStartSessionRecording requires app entry and main window", () => {
  const config = {
    enabled: true,
    host: "https://us.i.posthog.com",
    projectKey: "phc_test",
  };

  assert.equal(canStartSessionRecording({ config, hasEnteredApp: true, isQuickSidebar: false }), true);
  assert.equal(canStartSessionRecording({ config, hasEnteredApp: false, isQuickSidebar: false }), false);
  assert.equal(canStartSessionRecording({ config, hasEnteredApp: true, isQuickSidebar: true }), false);
});
