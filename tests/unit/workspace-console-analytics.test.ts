import assert from "node:assert/strict";
import test from "node:test";
import {
  getWorkspaceConsoleErrorKind,
  getWorkspaceConsoleExitCodeBucket,
  normalizeWorkspaceConsoleStatus,
  normalizeWorkspaceConsoleTargetKind,
} from "../../src/lib/workspace-console-analytics.js";
import {
  trackWorkspaceConsoleOpened,
  trackWorkspaceConsoleSessionCloseFailed,
  trackWorkspaceConsoleSessionCreated,
  trackWorkspaceConsoleSessionErrored,
  trackWorkspaceConsoleSessionExited,
} from "../../src/services/workspace-console-analytics.js";

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

test("workspace console analytics helpers keep payloads coarse", () => {
  assert.equal(normalizeWorkspaceConsoleTargetKind("workspace"), "workspace");
  assert.equal(normalizeWorkspaceConsoleTargetKind("/repo/private"), "unknown");
  assert.equal(normalizeWorkspaceConsoleStatus(), "unknown");
  assert.equal(getWorkspaceConsoleExitCodeBucket(0), "zero");
  assert.equal(getWorkspaceConsoleExitCodeBucket(2), "nonzero");
  assert.equal(getWorkspaceConsoleExitCodeBucket(), "unknown");
  assert.equal(
    getWorkspaceConsoleErrorKind("CWD is outside workspace root: /Users/example"),
    "cwd-invalid",
  );
  assert.equal(
    getWorkspaceConsoleErrorKind("Workspace Console is available in the desktop app."),
    "desktop-unavailable",
  );
});

test("workspace console analytics wrappers send typed privacy-safe events", () => {
  const calls: Array<{
    event: string;
    payload?: Record<string, string | number | boolean>;
  }> = [];
  const originalWindow = globalThis.window;

  try {
    setElectronWindow(calls);
    trackWorkspaceConsoleOpened({
      reusedExistingSession: true,
      sessionCount: 2,
      source: "workspace-card",
      targetKind: "workspace",
    });
    trackWorkspaceConsoleSessionCreated({
      sessionCount: 3,
      source: "new-shell",
      targetKind: "base",
    });
    trackWorkspaceConsoleSessionCloseFailed({
      confirmRequired: false,
      error: "Session not found: /secret/path",
      status: "running",
    });
    trackWorkspaceConsoleSessionExited(1);
    trackWorkspaceConsoleSessionErrored("spawn /bin/zsh failed");

    assert.deepEqual(calls, [
      {
        event: "WorkspaceConsole.opened",
        payload: {
          reusedExistingSession: true,
          sessionCount: 2,
          source: "workspace-card",
          targetKind: "workspace",
        },
      },
      {
        event: "WorkspaceConsole.sessionCreated",
        payload: { sessionCount: 3, source: "new-shell", targetKind: "base" },
      },
      {
        event: "WorkspaceConsole.sessionCloseFailed",
        payload: {
          confirmRequired: false,
          errorKind: "session-missing",
          status: "running",
        },
      },
      {
        event: "WorkspaceConsole.sessionExited",
        payload: { exitCodeBucket: "nonzero", hadSignal: false },
      },
      {
        event: "WorkspaceConsole.sessionErrored",
        payload: { errorKind: "spawn-failed" },
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
