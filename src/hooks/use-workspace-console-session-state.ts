import { useEffect, useMemo, useState } from "react";
import {
  listWorkspaceConsoleSessions,
  onWorkspaceConsoleEvent,
} from "@/services/workspace-console";
import type {
  WorkspaceConsoleEvent,
  WorkspaceConsoleSession,
} from "@/types/workspace-console";

const upsertSession = (
  sessions: WorkspaceConsoleSession[],
  nextSession: WorkspaceConsoleSession,
): WorkspaceConsoleSession[] => {
  const exists = sessions.some((session) => session.sessionId === nextSession.sessionId);
  return exists
    ? sessions.map((session) =>
        session.sessionId === nextSession.sessionId ? nextSession : session,
      )
    : [...sessions, nextSession];
};

const applyEvent = (
  sessions: WorkspaceConsoleSession[],
  event: WorkspaceConsoleEvent,
): WorkspaceConsoleSession[] => {
  if (event.type === "created") return upsertSession(sessions, event.session);
  if (event.type === "removed") {
    return sessions.filter((session) => session.sessionId !== event.sessionId);
  }
  return sessions.map((session) => {
    if (session.sessionId !== event.sessionId) return session;
    if (event.type === "title") return { ...session, title: event.title };
    if (event.type === "error") return { ...session, status: "error" };
    if (event.type === "exit") {
      return {
        ...session,
        exitCode: event.exitCode,
        signal: event.signal,
        status: "exited",
      };
    }
    return session;
  });
};

export const useWorkspaceConsoleSessionState = () => {
  const [sessions, setSessions] = useState<WorkspaceConsoleSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    void listWorkspaceConsoleSessions().then((nextSessions) => {
      if (!mounted) return;
      setSessions(nextSessions);
      setActiveSessionId((current) => current ?? nextSessions[0]?.sessionId ?? null);
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(
    () =>
      onWorkspaceConsoleEvent((event) => {
        setSessions((currentSessions) => {
          const nextSessions = applyEvent(currentSessions, event);
          if (event.type === "created") {
            setActiveSessionId((current) => current ?? event.session.sessionId);
          }
          if (event.type === "removed") {
            setActiveSessionId((current) =>
              current === event.sessionId ? nextSessions[0]?.sessionId ?? null : current,
            );
          }
          return nextSessions;
        });
      }),
    [],
  );

  const activeSession = useMemo(
    () => sessions.find((session) => session.sessionId === activeSessionId) ?? null,
    [activeSessionId, sessions],
  );

  return {
    activeSession,
    activeSessionId,
    sessions,
    setActiveSessionId,
  };
};
