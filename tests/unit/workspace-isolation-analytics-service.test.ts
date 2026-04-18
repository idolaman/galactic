import assert from "node:assert/strict";
import test from "node:test";
import {
  trackWorkspaceIsolationActivationCompleted,
  trackWorkspaceIsolationActivationOffered,
  trackWorkspaceIsolationActivationSkipped,
  trackWorkspaceIsolationAutoEnvEnableCompleted,
  trackWorkspaceIsolationDialogOpened,
  trackWorkspaceIsolationInfoDialogOpened,
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

test("workspace isolation analytics wrappers send the expected typed events", () => {
  const calls: Array<{
    event: string;
    payload?: Record<string, string | number | boolean>;
  }> = [];
  const originalWindow = globalThis.window;

  try {
    setElectronWindow(calls);
    trackWorkspaceIsolationDialogOpened(
      false,
      "intro",
      "needs-setup",
    );
    trackWorkspaceIsolationInfoDialogOpened();
    trackWorkspaceIsolationAutoEnvEnableCompleted("settings-card", true);
    trackWorkspaceIsolationActivationOffered({
      source: "project-dialog",
      targetKind: "base",
      isFirstTimeSetup: true,
    });
    trackWorkspaceIsolationActivationCompleted({
      source: "project-dialog",
      targetKind: "workspace",
      isFirstTimeSetup: true,
    });
    trackWorkspaceIsolationActivationSkipped({
      source: "project-dialog",
      targetKind: "workspace",
      isFirstTimeSetup: true,
    });
    trackWorkspaceIsolationSaved(false, "enabled", {
      workspaceMode: "monorepo",
      serviceCount: 2,
      connectionCount: 3,
      externalConnectionCount: 1,
    });

    assert.deepEqual(calls, [
      {
        event: "WorkspaceIsolation.dialogOpened",
        payload: {
          isEdit: false,
          openingStep: "intro",
          autoEnvState: "needs-setup",
          source: "workspace-card",
        },
      },
      {
        event: "WorkspaceIsolation.infoDialogOpened",
        payload: {
          source: "settings-info",
        },
      },
      {
        event: "WorkspaceIsolation.autoEnvEnableCompleted",
        payload: {
          source: "settings-card",
          success: true,
        },
      },
      {
        event: "WorkspaceIsolation.activationOffered",
        payload: {
          source: "project-dialog",
          targetKind: "base",
          isFirstTimeSetup: true,
        },
      },
      {
        event: "WorkspaceIsolation.activationCompleted",
        payload: {
          source: "project-dialog",
          targetKind: "workspace",
          isFirstTimeSetup: true,
        },
      },
      {
        event: "WorkspaceIsolation.activationSkipped",
        payload: {
          source: "project-dialog",
          targetKind: "workspace",
          isFirstTimeSetup: true,
        },
      },
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
