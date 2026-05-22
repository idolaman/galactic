import assert from "node:assert/strict";
import test from "node:test";

import {
  buildVisibleWorkspaceSessionMap,
  countVisibleProjectSessions,
  type WorkspaceSession,
} from "../../src/lib/workspace-session-display.js";

const createSession = (
  id: string,
  workspacePath: string,
): WorkspaceSession => ({
  id,
  started_at: "2026-03-01T10:00:00.000Z",
  workspace_path: workspacePath,
});

test("counts visible sessions across a project root and workspaces", () => {
  const sessions = [
    createSession("session-1", "/repo"),
    createSession("session-2", "/repo/worktrees/feature"),
    createSession("session-3", "/other"),
  ];
  const project = {
    path: "/repo/",
    workspaces: [{ workspace: "/repo/worktrees/feature/" }],
  };

  const visibleSessionsByPath = buildVisibleWorkspaceSessionMap(sessions);

  assert.equal(countVisibleProjectSessions(project, visibleSessionsByPath), 2);
});

test("returns zero when a project has no visible sessions", () => {
  const visibleSessionsByPath = buildVisibleWorkspaceSessionMap([
    createSession("session-1", "/another-repo"),
  ]);

  assert.equal(
    countVisibleProjectSessions({ path: "/repo", workspaces: [] }, visibleSessionsByPath),
    0,
  );
});

test("does not double count duplicate project paths", () => {
  const visibleSessionsByPath = buildVisibleWorkspaceSessionMap([
    createSession("session-1", "/repo"),
  ]);
  const project = {
    path: "/repo",
    workspaces: [{ workspace: "/repo/" }],
  };

  assert.equal(countVisibleProjectSessions(project, visibleSessionsByPath), 1);
});
