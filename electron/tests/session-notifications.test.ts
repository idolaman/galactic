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
    preferredEditor: "Cursor",
  });

  assert.equal(notifications.length, 1);
  assert.equal(notifications[0]?.title, "Claude finished");
  assert.equal(notifications[0]?.subtitle, "Ship the notification feature");
  assert.equal(notifications[0]?.body, "galactic-ide | feature/mac-notifications | 5m");
  assert.equal(notifications[0]?.actionText, "Open in Cursor");
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
    preferredEditor: "Cursor",
  });

  assert.deepEqual(notifications, []);
});

test("getFinishedSessionNotifications does not replay finished sessions from the initial snapshot", () => {
  const notifications = getFinishedSessionNotifications({
    allowNewDoneSessions: false,
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
    preferredEditor: "Cursor",
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
    "Cursor",
  );

  assert.equal(notification.title, "My Custom Agent finished");
  assert.equal(notification.subtitle, "Review tests");
  assert.equal(notification.body, "Workspace unavailable.");
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
    "VSCode",
  );

  assert.equal(notification.title, "Codex finished");
  assert.equal(notification.subtitle, "Open the worktree");
  assert.equal(notification.body, "open-the-worktree");
  assert.equal(notification.actionText, "Open in VS Code");
  assert.equal(notification.workspacePath, "/tmp/feature/open-the-worktree");
});

test("buildFinishedSessionNotification keeps compact context when no workspace is available", () => {
  const notification = buildFinishedSessionNotification(
    {
      id: "session-5",
      title: "Investigate the scanner failure",
      status: "done",
      platform: "codex",
      project: "ScannerEngine",
      gitBranch: "feature/redesign",
      startedAt: "2026-03-21T10:00:00.000Z",
      endedAt: "2026-03-21T10:08:00.000Z",
    },
    "Cursor",
  );

  assert.equal(notification.title, "Codex finished");
  assert.equal(notification.subtitle, "Investigate the scanner failure");
  assert.equal(notification.body, "ScannerEngine | feature/redesign | 8m");
  assert.equal(notification.actionText, undefined);
});

test("getFinishedSessionNotifications does not add an open action for blank workspace paths", () => {
  const notifications = getFinishedSessionNotifications({
    allowNewDoneSessions: true,
    nextSessions: [
      {
        id: "session-6",
        title: "Review artifacts",
        status: "done",
        platform: "claude",
        workspace_path: "   ",
        ended_at: "2026-03-21T10:05:00.000Z",
      },
    ],
    notifiedSignatures: new Set<string>(),
    preferredEditor: "Cursor",
    previousSessions: [
      {
        id: "session-6",
        title: "Review artifacts",
        status: "in_progress",
        started_at: "2026-03-21T10:00:00.000Z",
      },
    ],
  });

  assert.equal(notifications.length, 1);
  assert.equal(notifications[0]?.body, "5m");
  assert.equal(notifications[0]?.actionText, undefined);
  assert.equal(notifications[0]?.workspacePath, undefined);
});
