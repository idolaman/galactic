import { promises as fs } from "node:fs";
import type { ClaudeHookEvent, ClaudeHookSessionSummary } from "./types.js";

const parseEvent = (line: string): ClaudeHookEvent | null => {
  try {
    const parsed = JSON.parse(line) as ClaudeHookEvent;
    if (!parsed || typeof parsed !== "object" || typeof parsed.event !== "string") {
      return null;
    }

    if (
      parsed.event === "session.started"
      && typeof parsed.id === "string"
      && typeof parsed.title === "string"
      && typeof parsed.started_at === "string"
      && parsed.platform === "claude"
      && typeof parsed.chat_id === "string"
    ) {
      return parsed;
    }

    if (parsed.event === "approval.pending" && typeof parsed.id === "string" && typeof parsed.at === "string") {
      return parsed;
    }

    if (parsed.event === "approval.cleared" && typeof parsed.id === "string") {
      return parsed;
    }

    if (parsed.event === "session.finished" && typeof parsed.id === "string" && typeof parsed.ended_at === "string") {
      return parsed;
    }

    return null;
  } catch {
    return null;
  }
};

export const reduceClaudeHookEvents = (events: ClaudeHookEvent[]): ClaudeHookSessionSummary[] => {
  const sessions = new Map<string, ClaudeHookSessionSummary>();

  for (const event of events) {
    if (event.event === "session.started") {
      sessions.set(event.id, {
        id: event.id,
        title: event.title,
        started_at: event.started_at,
        platform: "claude",
        workspace_path: event.workspace_path,
        chat_id: event.chat_id,
        status: "in_progress",
      });
      continue;
    }

    const session = sessions.get(event.id);
    if (!session) {
      continue;
    }

    if (event.event === "approval.pending") {
      session.approval_pending_since = event.at;
      continue;
    }

    if (event.event === "approval.cleared") {
      delete session.approval_pending_since;
      continue;
    }

    session.ended_at = event.ended_at;
    delete session.approval_pending_since;
    session.status = "done";
  }

  return [...sessions.values()];
};

export const readClaudeHookSessions = async (eventLogPath: string): Promise<ClaudeHookSessionSummary[]> => {
  try {
    const content = await fs.readFile(eventLogPath, "utf8");
    const events = content
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map(parseEvent)
      .filter((event): event is ClaudeHookEvent => Boolean(event));
    return reduceClaudeHookEvents(events);
  } catch (error) {
    const missingFile = error instanceof Error && "code" in error && error.code === "ENOENT";
    return missingFile ? [] : [];
  }
};
