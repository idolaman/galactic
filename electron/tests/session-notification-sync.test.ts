import assert from "node:assert/strict";
import test from "node:test";

import { syncFinishedSessionNotificationState } from "../utils/session-notification-sync.js";

test("disabled event notifications suppress display but still record finished signatures", () => {
  const result = syncFinishedSessionNotificationState({
    nextSessions: [
      {
        id: "session-1",
        title: "Ship the notification feature",
        status: "done",
        platform: "claude",
        ended_at: "2026-03-23T09:05:00.000Z",
      },
    ],
    notificationsEnabled: false,
    notifiedSignatures: new Set<string>(),
    preferredEditor: "Cursor",
    previousSessions: [
      {
        id: "session-1",
        title: "Ship the notification feature",
        status: "in_progress",
        started_at: "2026-03-23T09:00:00.000Z",
      },
    ],
    sessionCachePrimed: true,
  });

  assert.deepEqual(result.notificationsToShow, []);
  assert.equal(result.signaturesToRecord.length, 1);
  assert.equal(result.nextSessionCachePrimed, true);
});

test("re-enabling event notifications only emits for later finished sessions", () => {
  const disabledResult = syncFinishedSessionNotificationState({
    nextSessions: [
      {
        id: "session-1",
        title: "Already finished while muted",
        status: "done",
        platform: "codex",
        ended_at: "2026-03-23T09:05:00.000Z",
      },
    ],
    notificationsEnabled: false,
    notifiedSignatures: new Set<string>(),
    preferredEditor: "Cursor",
    previousSessions: [
      {
        id: "session-1",
        title: "Already finished while muted",
        status: "in_progress",
        started_at: "2026-03-23T09:00:00.000Z",
      },
    ],
    sessionCachePrimed: true,
  });

  const enabledResult = syncFinishedSessionNotificationState({
    nextSessions: [
      ...disabledResult.nextCachedSessions,
      {
        id: "session-2",
        title: "Finished after notifications returned",
        status: "done",
        platform: "claude",
        workspace_path: "/tmp/feature/notifications",
        ended_at: "2026-03-23T09:10:00.000Z",
      },
    ],
    notificationsEnabled: true,
    notifiedSignatures: new Set<string>(disabledResult.signaturesToRecord),
    preferredEditor: "VSCode",
    previousSessions: disabledResult.nextCachedSessions,
    sessionCachePrimed: disabledResult.nextSessionCachePrimed,
  });

  assert.equal(enabledResult.notificationsToShow.length, 1);
  assert.equal(enabledResult.notificationsToShow[0]?.title, "Claude finished");
  assert.equal(enabledResult.notificationsToShow[0]?.actionText, "Open in VS Code");
});
