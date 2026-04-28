import assert from "node:assert/strict";
import test from "node:test";

import {
  capturePostHogClientEvent,
  captureTelemetryDeckClientEvent,
  type PostHogClient,
} from "../analytics-capture.js";

const context = {
  appVersion: "1.0.28",
  platform: "darwin" as const,
};

test("PostHog capture uses sanitized properties", () => {
  const calls: unknown[] = [];
  const client: PostHogClient = {
    capture: (message) => calls.push(message),
    shutdown: async () => undefined,
  };

  capturePostHogClientEvent(client, "Workspace.created", "install-1", context, {
    branch: "private-branch",
    source: "workspace-card",
  });

  assert.deepEqual(calls, [{
    distinctId: "install-1",
    event: "Workspace.created",
    properties: {
      appVersion: "1.0.28",
      platform: "darwin",
      source: "workspace-card",
    },
  }]);
});

test("analytics provider capture failures do not throw", () => {
  const originalConsoleError = console.error;
  const throwingPostHog: PostHogClient = {
    capture: () => {
      throw new Error("posthog failed");
    },
    shutdown: async () => undefined,
  };
  const throwingTelemetryDeck = {
    signal: () => {
      throw new Error("telemetrydeck failed");
    },
  };

  try {
    console.error = () => undefined;
    assert.doesNotThrow(() => {
      capturePostHogClientEvent(throwingPostHog, "App.launched", "install-1", context);
      captureTelemetryDeckClientEvent(throwingTelemetryDeck, "App.launched", context);
    });
  } finally {
    console.error = originalConsoleError;
  }
});
