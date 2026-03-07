import type { SessionSummary } from "@/types/session";

const getTimestamp = (session: SessionSummary) => {
  const timestamp = new Date(session.ended_at || session.started_at || 0).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
};

export const getSessionKey = (session: SessionSummary) => session.chat_id || session.id;

export const getSessionSignature = (session: SessionSummary) => {
  return `${session.id}:${session.status}:${session.started_at ?? ""}:${session.ended_at ?? ""}`;
};

export const buildOrderedSessions = (
  sessions: SessionSummary[],
  dismissedSessions: Map<string, string>,
  ordering: Map<string, number>,
  nextOrder: () => number,
): SessionSummary[] => {
  const latestByChat = new Map<string, SessionSummary>();
  const withoutChat: SessionSummary[] = [];

  sessions.forEach((session) => {
    if (!session.chat_id) {
      withoutChat.push(session);
      return;
    }

    const existing = latestByChat.get(session.chat_id);
    if (!existing || getTimestamp(session) >= getTimestamp(existing)) {
      latestByChat.set(session.chat_id, session);
    }
  });

  return [...withoutChat, ...latestByChat.values()]
    .filter((session) => dismissedSessions.get(getSessionKey(session)) !== getSessionSignature(session))
    .map((session) => {
      const key = getSessionKey(session);
      if (!ordering.has(key)) {
        ordering.set(key, nextOrder());
      }
      return { order: ordering.get(key) ?? 0, session };
    })
    .sort((left, right) => left.order - right.order)
    .map((entry) => entry.session);
};
