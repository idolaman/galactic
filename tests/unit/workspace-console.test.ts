import assert from "node:assert/strict";
import test from "node:test";
import {
  findWorkspaceConsoleSessionForWorkspace,
  getWorkspaceConsolePresentation,
  runWorkspaceConsoleOpenRequest,
  shouldShowWorkspaceConsoleDock,
  shouldShowWorkspaceConsoleRestoreBar,
  shouldConfirmWorkspaceConsoleClose,
} from "../../src/lib/workspace-console.js";
import {
  createWorkspaceConsoleSession,
  isWorkspaceConsoleEvent,
} from "../../src/services/workspace-console.js";
import type { WorkspaceConsoleSession } from "../../src/types/workspace-console.js";

type PresentationInput = Parameters<typeof getWorkspaceConsolePresentation>[0];
type DockVisibilityInput = Parameters<typeof shouldShowWorkspaceConsoleDock>[0];

const createDeferred = (): { promise: Promise<void>; resolve: () => void } => {
  let resolveDeferred!: () => void;
  const promise = new Promise<void>((resolve) => {
    resolveDeferred = resolve;
  });
  return { promise, resolve: resolveDeferred };
};

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
  const globalWithWindow = globalThis as { window?: unknown };
  const hadWindow = Object.prototype.hasOwnProperty.call(globalWithWindow, "window");
  const previousWindow = globalWithWindow.window;
  delete globalWithWindow.window;
  try {
    assert.deepEqual(await createWorkspaceConsoleSession({ workspacePath: "/repo" }), {
      success: false,
      error: "Workspace Console is available in the desktop app.",
    });
  } finally {
    if (hadWindow) globalWithWindow.window = previousWindow;
    else delete globalWithWindow.window;
  }
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
  const cases: Array<[WorkspaceConsoleSession["status"], boolean]> = [
    ["running", true],
    ["starting", true],
    ["exited", false],
  ];

  for (const [status, expected] of cases) {
    assert.equal(
      shouldConfirmWorkspaceConsoleClose(createSession("s1", "/repo", status)),
      expected,
    );
  }
});

test("workspace console chooses an existing session for a workspace", () => {
  const sessions = [createSession("s1", "/repo"), createSession("s2", "/repo/app")];

  assert.equal(
    findWorkspaceConsoleSessionForWorkspace(sessions, "/repo/app")?.sessionId,
    "s2",
  );
  assert.equal(findWorkspaceConsoleSessionForWorkspace(sessions, "/missing"), null);
});

test("workspace console open request dedupes in-flight creates per workspace", async () => {
  const pendingOpens = new Map<string, Promise<void>>();
  const deferredCreate = createDeferred();
  let createCount = 0;
  const createSession = async () => {
    createCount += 1;
    await deferredCreate.promise;
  };

  const firstOpen = runWorkspaceConsoleOpenRequest({
    createSession,
    pendingOpens,
    workspacePath: "/repo",
  });
  const secondOpen = runWorkspaceConsoleOpenRequest({
    createSession,
    pendingOpens,
    workspacePath: "/repo",
  });

  assert.equal(createCount, 1);
  assert.equal(pendingOpens.has("/repo"), true);
  deferredCreate.resolve();
  await Promise.all([firstOpen, secondOpen]);
  assert.equal(pendingOpens.has("/repo"), false);
});

test("workspace console open request keeps different workspaces independent", async () => {
  const pendingOpens = new Map<string, Promise<void>>();
  let createCount = 0;
  const createSession = async () => {
    createCount += 1;
  };

  await Promise.all([
    runWorkspaceConsoleOpenRequest({
      createSession,
      pendingOpens,
      workspacePath: "/repo",
    }),
    runWorkspaceConsoleOpenRequest({
      createSession,
      pendingOpens,
      workspacePath: "/repo/app",
    }),
  ]);

  assert.equal(createCount, 2);
  assert.equal(pendingOpens.size, 0);
});

test("workspace console restore bar only appears for hidden project-route sessions", () => {
  const cases: Array<[DockVisibilityInput, boolean]> = [
    [{ isOpen: false, routeVisible: true, sessionCount: 1 }, true],
    [{ isOpen: true, routeVisible: true, sessionCount: 1 }, false],
    [{ isOpen: false, routeVisible: false, sessionCount: 1 }, false],
    [{ isOpen: false, routeVisible: true, sessionCount: 0 }, false],
  ];

  for (const [input, expected] of cases) {
    assert.equal(shouldShowWorkspaceConsoleRestoreBar(input), expected);
  }
});

test("workspace console presentation chooses the route-scoped console surface", () => {
  const cases: Array<[PresentationInput, string]> = [
    [{ isExpanded: false, isOpen: false, routeVisible: true, sessionCount: 0 }, "none"],
    [
      { isExpanded: false, isOpen: true, routeVisible: false, sessionCount: 1 },
      "none",
    ],
    [
      { isExpanded: true, isOpen: false, routeVisible: true, sessionCount: 1 },
      "restore",
    ],
    [{ isExpanded: false, isOpen: true, routeVisible: true, sessionCount: 1 }, "dock"],
    [
      { isExpanded: true, isOpen: true, routeVisible: true, sessionCount: 1 },
      "expanded",
    ],
  ];

  for (const [input, expected] of cases) {
    assert.equal(getWorkspaceConsolePresentation(input), expected);
  }
});

test("workspace console dock only appears for open project-route sessions", () => {
  const cases: Array<[DockVisibilityInput, boolean]> = [
    [{ isOpen: true, routeVisible: true, sessionCount: 1 }, true],
    [{ isOpen: true, routeVisible: true, sessionCount: 0 }, false],
    [{ isOpen: true, routeVisible: false, sessionCount: 1 }, false],
    [{ isOpen: false, routeVisible: true, sessionCount: 1 }, false],
    [{ isExpanded: true, isOpen: true, routeVisible: true, sessionCount: 1 }, true],
  ];

  for (const [input, expected] of cases) {
    assert.equal(shouldShowWorkspaceConsoleDock(input), expected);
  }
});
