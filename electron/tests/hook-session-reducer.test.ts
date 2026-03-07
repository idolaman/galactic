import assert from "node:assert/strict";
import test from "node:test";
import { reduceHookEventsToSessions } from "../hooks/session-reducer.js";

test("session reducer merges prompt start, approval state, and finish", () => {
  const sessions = reduceHookEventsToSessions([
    {
      type: "session.started",
      sessionId: "session-1",
      chatId: "session-1",
      title: "Ship the refactor",
      workspacePath: "/repo",
      platform: "claude",
      startedAt: "2026-03-06T10:00:00.000Z",
    },
    { type: "approval.pending", sessionId: "session-1", at: "2026-03-06T10:01:00.000Z" },
    { type: "approval.cleared", sessionId: "session-1", at: "2026-03-06T10:02:00.000Z" },
    {
      type: "session.finished",
      sessionId: "session-1",
      endedAt: "2026-03-06T10:03:00.000Z",
      status: "ok",
    },
  ]);

  assert.equal(sessions.length, 1);
  assert.deepEqual(sessions[0], {
    id: "session-1",
    chat_id: "session-1",
    title: "Ship the refactor",
    workspace_path: "/repo",
    platform: "claude",
    started_at: "2026-03-06T10:00:00.000Z",
    ended_at: "2026-03-06T10:03:00.000Z",
    status: "done",
  });
});

test("session reducer keeps placeholder sessions when finish arrives before start", () => {
  const sessions = reduceHookEventsToSessions([
    {
      type: "session.finished",
      sessionId: "session-2",
      endedAt: "2026-03-06T11:00:00.000Z",
      status: "error",
      error: "boom",
    },
  ]);

  assert.equal(sessions.length, 1);
  assert.equal(sessions[0].id, "session-2");
  assert.equal(sessions[0].title, "Agent session");
  assert.equal(sessions[0].status, "done");
});
