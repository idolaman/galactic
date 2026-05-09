import assert from "node:assert/strict";
import test from "node:test";

import {
  trackAnalyticsEvent,
  trackSettingsEditorChanged,
  trackSettingsMcpInstalled,
  trackUserLoggedIn,
  trackUserLoggedOut,
} from "../../src/services/analytics.js";

const withElectronWindow = (
  callback: (calls: Array<{ event: string; payload?: Record<string, string | number | boolean> }>) => void,
) => {
  const calls: Array<{ event: string; payload?: Record<string, string | number | boolean> }> = [];
  const originalWindow = globalThis.window;

  try {
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: {
        electronAPI: {
          trackAnalyticsEvent: (
            event: string,
            payload?: Record<string, string | number | boolean>,
          ) => {
            calls.push({ event, payload });
            return Promise.resolve({ success: true });
          },
        },
      },
    });
    callback(calls);
  } finally {
    if (originalWindow === undefined) {
      Reflect.deleteProperty(globalThis as { window?: unknown }, "window");
    } else {
      Object.defineProperty(globalThis, "window", {
        configurable: true,
        value: originalWindow,
      });
    }
  }
};

test("analytics wrappers send typed user and settings events", () => {
  withElectronWindow((calls) => {
    trackUserLoggedIn();
    trackUserLoggedOut();
    trackSettingsEditorChanged("Cursor");
    trackSettingsMcpInstalled("VSCode");

    assert.deepEqual(calls, [
      { event: "User.loggedIn", payload: undefined },
      { event: "User.loggedOut", payload: undefined },
      { event: "Settings.editorChanged", payload: { editor: "Cursor" } },
      { event: "Settings.mcpInstalled", payload: { tool: "VSCode" } },
    ]);
  });
});

test("trackAnalyticsEvent drops undefined payload values", () => {
  withElectronWindow((calls) => {
    trackAnalyticsEvent("Environment.attached", {
      envVars: 2,
      reassigned: undefined,
      targetKind: "workspace",
    });

    assert.deepEqual(calls, [
      {
        event: "Environment.attached",
        payload: { envVars: 2, targetKind: "workspace" },
      },
    ]);
  });
});
