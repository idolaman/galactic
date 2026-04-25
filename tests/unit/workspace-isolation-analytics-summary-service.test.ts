import assert from "node:assert/strict";
import test from "node:test";
import {
  trackWorkspaceIsolationDeleted,
  trackWorkspaceIsolationSaved,
} from "../../src/services/workspace-isolation-analytics.js";

const setElectronWindow = (
  calls: Array<{ event: string; payload?: Record<string, string | number | boolean> }>,
) => {
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
};

test("workspace isolation summary analytics keep setup and delete segmentation", () => {
  const calls: Array<{
    event: string;
    payload?: Record<string, string | number | boolean>;
  }> = [];
  const originalWindow = globalThis.window;

  try {
    setElectronWindow(calls);
    trackWorkspaceIsolationSaved(false, "enabled", {
      workspaceMode: "monorepo",
      serviceCount: 2,
      connectionCount: 3,
      externalConnectionCount: 1,
    });
    trackWorkspaceIsolationDeleted({
      workspaceMode: "single-app",
      serviceCount: 1,
      connectionCount: 0,
      externalConnectionCount: 0,
    });

    assert.deepEqual(calls, [
      {
        event: "WorkspaceIsolation.saved",
        payload: {
          isEdit: false,
          autoEnvState: "enabled",
          workspaceMode: "monorepo",
          serviceCount: 2,
          connectionCount: 3,
          externalConnectionCount: 1,
        },
      },
      {
        event: "WorkspaceIsolation.deleted",
        payload: {
          workspaceMode: "single-app",
          serviceCount: 1,
          connectionCount: 0,
          externalConnectionCount: 0,
        },
      },
    ]);
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
});
