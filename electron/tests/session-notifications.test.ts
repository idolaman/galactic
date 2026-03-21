import assert from "node:assert/strict";
import test from "node:test";
import {
  buildFinishedSessionNotification,
  getFinishedSessionNotifications,
  getFinishedSessionSignature,
} from "../utils/session-notifications.js";

test("getFinishedSessionNotifications emits a notification when a session turns done", () => {
  const notifications = getFinishedSessionNotifications({
    allowNewDoneSessions: true,
    hotkeyEnabled: true,
    nextSessions: [
      {
        id: "session-1",
        title: "Ship the notification feature",
        status: "done",
        platform: "claude",
        project: "galactic-ide",
        git_branch: "feature/mac-notifications",
        workspace_path: "/tmp/feature/mac-notifications",
        ended_at: "2026-03-21T10:05:00.000Z",
      },
    ],
    notifiedSignatures: new Set<string>(),
    previousSessions: [
      {
        id: "session-1",
        title: "Ship the notification feature",
        status: "in_progress",
        platform: "claude",
        project: "galactic-ide",
        git_branch: "feature/mac-notifications",
        workspace_path: "/tmp/feature/mac-notifications",
        started_at: "2026-03-21T10:00:00.000Z",
      },
    ],
  });

  assert.equal(notifications.length, 1);
  assert.equal(notifications[0]?.title, "Claude has finished Ship the notification feature");
  assert.equal(
    notifications[0]?.body,
    "Go to it now or press Cmd+Shift+G for more information.",
  );
  assert.equal(notifications[0]?.subtitle, "galactic-ide - feature/mac-notifications");
  assert.equal(notifications[0]?.actionText, "Go to");
  assert.equal(notifications[0]?.workspacePath, "/tmp/feature/mac-notifications");
});

test("getFinishedSessionNotifications skips duplicate finished signatures", () => {
  const doneSession = {
    id: "session-1",
    title: "Ship the notification feature",
    status: "done",
    platform: "codex",
    ended_at: "2026-03-21T10:05:00.000Z",
  };

  const notifications = getFinishedSessionNotifications({
    allowNewDoneSessions: true,
    hotkeyEnabled: false,
    nextSessions: [doneSession],
    notifiedSignatures: new Set<string>([
      getFinishedSessionSignature({
        id: "session-1",
        title: "Ship the notification feature",
        status: "done",
        platform: "codex",
        endedAt: "2026-03-21T10:05:00.000Z",
      }),
    ]),
    previousSessions: [
      {
        id: "session-1",
        title: "Ship the notification feature",
        status: "in_progress",
      },
    ],
  });

  assert.deepEqual(notifications, []);
});

test("getFinishedSessionNotifications does not replay finished sessions from the initial snapshot", () => {
  const notifications = getFinishedSessionNotifications({
    allowNewDoneSessions: false,
    hotkeyEnabled: true,
    nextSessions: [
      {
        id: "session-3",
        title: "Existing finished session",
        status: "done",
        platform: "claude",
        workspace_path: "/tmp/repo",
        ended_at: "2026-03-21T09:55:00.000Z",
      },
    ],
    notifiedSignatures: new Set<string>(),
    previousSessions: [],
  });

  assert.deepEqual(notifications, []);
});

test("buildFinishedSessionNotification omits Go to when no workspace path exists", () => {
  const notification = buildFinishedSessionNotification(
    {
      id: "session-2",
      title: "Review tests",
      status: "done",
      platform: "my-custom-agent",
    },
    false,
  );

  assert.equal(notification.title, "My Custom Agent has finished Review tests");
  assert.equal(notification.body, "Open Galactic for more information.");
  assert.equal(notification.subtitle, undefined);
  assert.equal(notification.actionText, undefined);
});

test("buildFinishedSessionNotification includes Go to when a workspace path exists", () => {
  const notification = buildFinishedSessionNotification(
    {
      id: "session-4",
      title: "Open the worktree",
      status: "done",
      platform: "chatgpt",
      workspacePath: "/tmp/feature/open-the-worktree",
    },
    false,
  );

  assert.equal(notification.title, "Codex has finished Open the worktree");
  assert.equal(notification.body, "Go to it now for more information.");
  assert.equal(notification.actionText, "Go to");
  assert.equal(notification.workspacePath, "/tmp/feature/open-the-worktree");
});
