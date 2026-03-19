import assert from "node:assert/strict";
import test from "node:test";
import {
  MAX_VISIBLE_WORKSPACE_SESSIONS,
  buildVisibleWorkspaceSessionMap,
  normalizeWorkspacePath,
  type WorkspaceSession,
} from "../../src/lib/workspace-session-display.js";

interface TestSession extends WorkspaceSession {
  status: "done" | "in_progress";
  title: string;
}

const createSession = (
  id: string,
  started_at: string,
  overrides: Partial<TestSession> = {},
): TestSession => ({
  id,
  title: id,
  started_at,
  status: "in_progress",
  ...overrides,
});

test("keeps only the newest three sessions for a workspace", () => {
  const sessions = [
    createSession("session-1", "2026-03-01T10:00:00.000Z", { workspace_path: "/repo" }),
    createSession("session-2", "2026-03-01T10:01:00.000Z", { workspace_path: "/repo" }),
    createSession("session-3", "2026-03-01T10:02:00.000Z", { workspace_path: "/repo" }),
    createSession("session-4", "2026-03-01T10:03:00.000Z", { workspace_path: "/repo" }),
  ];

  const visibleSessions = buildVisibleWorkspaceSessionMap(sessions).get("/repo") ?? [];

  assert.equal(visibleSessions.length, MAX_VISIBLE_WORKSPACE_SESSIONS);
  assert.deepEqual(
    visibleSessions.map((session) => session.id),
    ["session-2", "session-3", "session-4"],
  );
});

test("deduplicates duplicate chat ids before applying the cap", () => {
  const sessions = [
    createSession("session-1", "2026-03-01T10:00:00.000Z", {
      chat_id: "chat-1",
      workspace_path: "/repo",
    }),
    createSession("session-2", "2026-03-01T10:01:00.000Z", {
      chat_id: "chat-1",
      workspace_path: "/repo",
    }),
    createSession("session-3", "2026-03-01T10:02:00.000Z", { workspace_path: "/repo" }),
    createSession("session-4", "2026-03-01T10:03:00.000Z", { workspace_path: "/repo" }),
    createSession("session-5", "2026-03-01T10:04:00.000Z", { workspace_path: "/repo" }),
  ];

  const visibleSessions = buildVisibleWorkspaceSessionMap(sessions).get("/repo") ?? [];

  assert.deepEqual(
    visibleSessions.map((session) => session.id),
    ["session-3", "session-4", "session-5"],
  );
});

test("normalizes windows workspace paths with case folding and trailing separators", () => {
  const sessions = [
    createSession("session-1", "2026-03-01T10:00:00.000Z", {
      workspace_path: "C:\\Repo\\Feature\\",
    }),
  ];

  const visibleSessions = buildVisibleWorkspaceSessionMap(sessions).get("c:\\repo\\feature") ?? [];

  assert.equal(visibleSessions[0]?.id, "session-1");
});

test("preserves case for posix workspace paths", () => {
  assert.equal(normalizeWorkspacePath("/Repo/Feature/"), "/Repo/Feature");
  assert.equal(normalizeWorkspacePath("/repo/feature/"), "/repo/feature");
});

test("keeps posix workspaces with different case separate", () => {
  const sessions = [
    createSession("session-1", "2026-03-01T10:00:00.000Z", {
      workspace_path: "/Repo/Feature",
    }),
    createSession("session-2", "2026-03-01T10:01:00.000Z", {
      workspace_path: "/repo/feature",
    }),
  ];

  const visibleSessionsByPath = buildVisibleWorkspaceSessionMap(sessions);

  assert.equal(visibleSessionsByPath.get("/Repo/Feature")?.[0]?.id, "session-1");
  assert.equal(visibleSessionsByPath.get("/repo/feature")?.[0]?.id, "session-2");
});

test("ignores sessions without a workspace path", () => {
  const sessions = [
    createSession("session-1", "2026-03-01T10:00:00.000Z"),
    createSession("session-2", "2026-03-01T10:01:00.000Z", { workspace_path: "/repo" }),
  ];

  const visibleSessionsByPath = buildVisibleWorkspaceSessionMap(sessions);

  assert.equal(visibleSessionsByPath.size, 1);
  assert.equal(visibleSessionsByPath.get("/repo")?.[0]?.id, "session-2");
});

test("preserves the existing display order for the retained sessions", () => {
  const sessions = [
    createSession("session-1", "2026-03-01T10:00:00.000Z", { workspace_path: "/repo" }),
    createSession("session-2", "2026-03-01T10:01:00.000Z", { workspace_path: "/repo" }),
    createSession("session-3", "2026-03-01T10:02:00.000Z", {
      chat_id: "chat-1",
      workspace_path: "/repo",
    }),
    createSession("session-4", "2026-03-01T10:03:00.000Z", {
      chat_id: "chat-1",
      workspace_path: "/repo",
    }),
    createSession("session-5", "2026-03-01T10:04:00.000Z", { workspace_path: "/another" }),
    createSession("session-6", "2026-03-01T10:05:00.000Z", { workspace_path: "/repo" }),
  ];

  const visibleSessions = buildVisibleWorkspaceSessionMap(sessions).get("/repo") ?? [];

  assert.deepEqual(
    visibleSessions.map((session) => session.id),
    ["session-2", "session-4", "session-6"],
  );
});
