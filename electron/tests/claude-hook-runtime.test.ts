import assert from "node:assert/strict";
import test from "node:test";
import { normalizeHookPayload } from "../claude-hooks/runtime/galactic-claude-hook.js";

test("normalizeHookPayload ignores Claude startup events", () => {
  const result = normalizeHookPayload(
    { hook_event_name: "SessionStart", session_id: "chat-1" },
    {},
    "2026-03-07T12:00:00.000Z",
  );

  assert.deepEqual(result.events, []);
  assert.deepEqual(result.activeRuns, {});
});

test("normalizeHookPayload starts a run on prompt submit and finishes it on stop", () => {
  const started = normalizeHookPayload(
    {
      hook_event_name: "UserPromptSubmit",
      session_id: "chat-1",
      prompt: "hey claude",
      cwd: "/tmp/project",
    },
    {},
    "2026-03-07T12:00:00.000Z",
  );

  assert.equal(started.events.length, 1);
  assert.equal(started.events[0]?.event, "session.started");
  assert.equal(started.events[0]?.title, "hey claude");
  assert.equal(started.events[0]?.chat_id, "chat-1");

  const finished = normalizeHookPayload(
    { hook_event_name: "Stop", session_id: "chat-1" },
    started.activeRuns,
    "2026-03-07T12:01:00.000Z",
  );

  assert.deepEqual(finished.activeRuns, {});
  assert.deepEqual(finished.events, [
    {
      event: "session.finished",
      id: started.events[0]?.id,
      ended_at: "2026-03-07T12:01:00.000Z",
    },
  ]);
});

test("normalizeHookPayload treats interrupt failures as terminal", () => {
  const started = normalizeHookPayload(
    { hook_event_name: "UserPromptSubmit", session_id: "chat-2", prompt: "long task" },
    {},
    "2026-03-07T12:00:00.000Z",
  );

  const interrupted = normalizeHookPayload(
    { hook_event_name: "PostToolUseFailure", session_id: "chat-2", is_interrupt: true },
    started.activeRuns,
    "2026-03-07T12:00:30.000Z",
  );

  assert.equal(interrupted.events.length, 2);
  assert.equal(interrupted.events[0]?.event, "approval.cleared");
  assert.equal(interrupted.events[1]?.event, "session.finished");
  assert.deepEqual(interrupted.activeRuns, {});
});
