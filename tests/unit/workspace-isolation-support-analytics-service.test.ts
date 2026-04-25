import assert from "node:assert/strict";
import test from "node:test";
import {
  trackWorkspaceIsolationLegacyBridgeOpened,
  trackWorkspaceIsolationLegacyBridgeSelected,
  trackWorkspaceIsolationProofDrawerOpened,
  trackWorkspaceIsolationWorkspaceStateViewed,
} from "../../src/services/workspace-isolation-support-analytics.js";

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

test("workspace isolation support analytics wrappers include support reason context", () => {
  const calls: Array<{
    event: string;
    payload?: Record<string, string | number | boolean>;
  }> = [];
  const originalWindow = globalThis.window;

  try {
    setElectronWindow(calls);
    trackWorkspaceIsolationWorkspaceStateViewed({
      state: "needs_attention",
      targetKind: "workspace",
      reason: "auto_env_off",
      hasDependencies: true,
      hasNonLiveDependencies: false,
    });
    trackWorkspaceIsolationProofDrawerOpened({
      targetKind: "workspace",
      reason: "connected_target_not_live",
      hasDependencies: true,
      hasNonLiveDependencies: true,
    });
    trackWorkspaceIsolationLegacyBridgeOpened({ targetKind: "base" });
    trackWorkspaceIsolationLegacyBridgeSelected({
      targetKind: "workspace",
      hasEnvironment: false,
    });

    assert.deepEqual(calls, [
      {
        event: "WorkspaceIsolation.workspaceStateViewed",
        payload: {
          state: "needs_attention",
          targetKind: "workspace",
          reason: "auto_env_off",
          hasDependencies: true,
          hasNonLiveDependencies: false,
        },
      },
      {
        event: "WorkspaceIsolation.proofDrawerOpened",
        payload: {
          targetKind: "workspace",
          reason: "connected_target_not_live",
          hasDependencies: true,
          hasNonLiveDependencies: true,
        },
      },
      {
        event: "WorkspaceIsolation.legacyBridgeOpened",
        payload: { targetKind: "base" },
      },
      {
        event: "WorkspaceIsolation.legacyBridgeSelected",
        payload: {
          targetKind: "workspace",
          hasEnvironment: false,
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
