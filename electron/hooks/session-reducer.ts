import type { GalacticHookEvent, HookSessionSummary } from "./types.js";

const defaultTitle = (platform?: string) => {
  return platform ? `${platform} session` : "Agent session";
};

const ensureSession = (
  sessions: Map<string, HookSessionSummary>,
  sessionId: string,
  platform?: string,
): HookSessionSummary => {
  const existing = sessions.get(sessionId);
  if (existing) {
    return existing;
  }

  const created: HookSessionSummary = {
    id: sessionId,
    chat_id: sessionId,
    title: defaultTitle(platform),
    platform,
    status: "in_progress",
  };
  sessions.set(sessionId, created);
  return created;
};

export const reduceHookEventsToSessions = (events: GalacticHookEvent[]): HookSessionSummary[] => {
  const sessions = new Map<string, HookSessionSummary>();

  for (const event of events) {
    if (event.type === "session.started") {
      const session = ensureSession(sessions, event.sessionId, event.platform);
      session.chat_id = event.chatId;
      session.platform = event.platform;
      session.title = event.title ?? session.title;
      session.workspace_path = event.workspacePath ?? session.workspace_path;
      if (event.gitBranch !== undefined) {
        session.git_branch = event.gitBranch;
      }
      if (event.estimatedDuration !== undefined) {
        session.estimated_duration = event.estimatedDuration;
      }
      session.started_at = session.started_at ?? event.startedAt;
      if (!session.ended_at) {
        session.status = "in_progress";
      }
      continue;
    }

    if (event.type === "approval.pending") {
      const session = ensureSession(sessions, event.sessionId);
      session.approval_pending_since = session.approval_pending_since ?? event.at;
      continue;
    }

    if (event.type === "approval.cleared") {
      const session = ensureSession(sessions, event.sessionId);
      delete session.approval_pending_since;
      continue;
    }

    const session = ensureSession(sessions, event.sessionId);
    session.ended_at = event.endedAt;
    delete session.approval_pending_since;
    session.status = "done";
  }

  return Array.from(sessions.values()).sort((left, right) => {
    const leftTime = new Date(left.started_at ?? left.ended_at ?? 0).getTime();
    const rightTime = new Date(right.started_at ?? right.ended_at ?? 0).getTime();
    return rightTime - leftTime;
  });
};
