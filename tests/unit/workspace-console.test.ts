import assert from "node:assert/strict";
import test from "node:test";
import {
  findWorkspaceConsoleSessionForWorkspace,
  shouldShowWorkspaceConsoleDock,
  shouldShowWorkspaceConsoleRestoreBar,
  shouldConfirmWorkspaceConsoleClose,
} from "../../src/lib/workspace-console.js";
import {
  createWorkspaceConsoleSession,
  isWorkspaceConsoleEvent,
} from "../../src/services/workspace-console.js";
import type { WorkspaceConsoleSession } from "../../src/types/workspace-console.js";

const createSession = (
  sessionId: string,
  workspacePath: string,
  status: WorkspaceConsoleSession["status"] = "running",
): WorkspaceConsoleSession => ({
  sessionId,
  workspacePath,
  workspaceLabel: workspacePath,
  cwd: workspacePath,
  status,
  title: workspacePath,
  createdAt: 1,
});

test("workspace console service falls back when desktop bridge is unavailable", async () => {
  delete (globalThis as { window?: unknown }).window;

  const result = await createWorkspaceConsoleSession({ workspacePath: "/repo" });

  assert.deepEqual(result, {
    success: false,
    error: "Workspace Console is available in the desktop app.",
  });
});

test("workspace console event guard accepts valid events and rejects malformed ones", () => {
  assert.equal(
    isWorkspaceConsoleEvent({ type: "data", sessionId: "s1", data: "ok" }),
    true,
  );
  assert.equal(
    isWorkspaceConsoleEvent({ type: "created", session: createSession("s1", "/repo") }),
    true,
  );
  assert.equal(isWorkspaceConsoleEvent({ type: "exit", sessionId: "s1" }), false);
  assert.equal(
    isWorkspaceConsoleEvent({
      type: "created",
      session: { ...createSession("s1", "/repo"), status: "paused" },
    }),
    false,
  );
});

test("workspace console close confirmation is only required for live sessions", () => {
  assert.equal(shouldConfirmWorkspaceConsoleClose(createSession("s1", "/repo")), true);
  assert.equal(
    shouldConfirmWorkspaceConsoleClose(createSession("s2", "/repo", "starting")),
    true,
  );
  assert.equal(
    shouldConfirmWorkspaceConsoleClose(createSession("s3", "/repo", "exited")),
    false,
  );
});

test("workspace console chooses an existing session for a workspace", () => {
  const sessions = [createSession("s1", "/repo"), createSession("s2", "/repo/app")];

  assert.equal(
    findWorkspaceConsoleSessionForWorkspace(sessions, "/repo/app")?.sessionId,
    "s2",
  );
  assert.equal(findWorkspaceConsoleSessionForWorkspace(sessions, "/missing"), null);
});

test("workspace console restore bar only appears for hidden project-route sessions", () => {
  assert.equal(
    shouldShowWorkspaceConsoleRestoreBar({
      isOpen: false,
      routeVisible: true,
      sessionCount: 1,
    }),
    true,
  );
  assert.equal(
    shouldShowWorkspaceConsoleRestoreBar({
      isOpen: true,
      routeVisible: true,
      sessionCount: 1,
    }),
    false,
  );
  assert.equal(
    shouldShowWorkspaceConsoleRestoreBar({
      isOpen: false,
      routeVisible: false,
      sessionCount: 1,
    }),
    false,
  );
  assert.equal(
    shouldShowWorkspaceConsoleRestoreBar({
      isOpen: false,
      routeVisible: true,
      sessionCount: 0,
    }),
    false,
  );
});

test("workspace console dock only appears for open project-route sessions", () => {
  assert.equal(
    shouldShowWorkspaceConsoleDock({
      isOpen: true,
      routeVisible: true,
      sessionCount: 1,
    }),
    true,
  );
  assert.equal(
    shouldShowWorkspaceConsoleDock({
      isOpen: true,
      routeVisible: true,
      sessionCount: 0,
    }),
    false,
  );
  assert.equal(
    shouldShowWorkspaceConsoleDock({
      isOpen: true,
      routeVisible: false,
      sessionCount: 1,
    }),
    false,
  );
  assert.equal(
    shouldShowWorkspaceConsoleDock({
      isOpen: false,
      routeVisible: true,
      sessionCount: 1,
    }),
    false,
  );
});
