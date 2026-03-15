import assert from "node:assert/strict";
import test from "node:test";
import {
  MAX_VISIBLE_WORKSPACE_SESSIONS,
  buildVisibleWorkspaceSessionMap,
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

test("normalizes workspace paths with case and trailing separators", () => {
  const sessions = [
    createSession("session-1", "2026-03-01T10:00:00.000Z", {
      workspace_path: "C:\\Repo\\Feature\\",
    }),
  ];

  const visibleSessions = buildVisibleWorkspaceSessionMap(sessions).get("c:\\repo\\feature") ?? [];

  assert.equal(visibleSessions[0]?.id, "session-1");
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
