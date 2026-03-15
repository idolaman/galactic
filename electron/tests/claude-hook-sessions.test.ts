import assert from "node:assert/strict";
import { mkdtemp, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { readClaudeHookSessions, reduceClaudeHookEvents } from "../claude-hooks/sessions.js";

test("reduceClaudeHookEvents keeps the existing session status contract", () => {
  const sessions = reduceClaudeHookEvents([
    {
      event: "session.started",
      id: "run-1",
      title: "hey",
      started_at: "2026-03-07T12:00:00.000Z",
      platform: "claude",
      chat_id: "chat-1",
      workspace_path: "/tmp/project",
    },
    { event: "approval.pending", id: "run-1", at: "2026-03-07T12:00:05.000Z" },
    { event: "approval.cleared", id: "run-1" },
    { event: "session.finished", id: "run-1", ended_at: "2026-03-07T12:01:00.000Z" },
  ]);

  assert.deepEqual(sessions, [
    {
      id: "run-1",
      title: "hey",
      started_at: "2026-03-07T12:00:00.000Z",
      ended_at: "2026-03-07T12:01:00.000Z",
      platform: "claude",
      workspace_path: "/tmp/project",
      chat_id: "chat-1",
      status: "done",
    },
  ]);
});

test("readClaudeHookSessions ignores malformed log lines", async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "galactic-claude-hooks-"));
  const eventLogPath = path.join(tempDir, "agent-events.ndjson");

  await writeFile(
    eventLogPath,
    [
      "{\"event\":\"session.started\",\"id\":\"run-1\",\"title\":\"hey\",\"started_at\":\"2026-03-07T12:00:00.000Z\",\"platform\":\"claude\",\"chat_id\":\"chat-1\"}",
      "not-json",
      "{\"event\":\"session.finished\",\"id\":\"run-1\",\"ended_at\":\"2026-03-07T12:01:00.000Z\"}",
    ].join("\n"),
    "utf8",
  );

  const sessions = await readClaudeHookSessions(eventLogPath);
  assert.equal(sessions.length, 1);
  assert.equal(sessions[0]?.status, "done");
});
