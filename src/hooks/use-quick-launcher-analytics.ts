import { useEffect, useRef } from "react";
import type { SessionSummary } from "@/services/session-rpc";
import {
  trackMcpSessionFocus,
  trackMcpSessionStatusChange,
  trackQuickLauncherNavigation,
} from "@/services/analytics";

interface QuickLauncherAnalyticsOptions {
  selectedId: string;
  sessions: SessionSummary[];
}

export const useQuickLauncherAnalytics = ({
  selectedId,
  sessions,
}: QuickLauncherAnalyticsOptions): void => {
  const lastFocusedSessionId = useRef<string>("");
  const statusBySession = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowUp") {
        trackQuickLauncherNavigation("up");
      }
      if (event.key === "ArrowDown") {
        trackQuickLauncherNavigation("down");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (!selectedId.startsWith("session-")) {
      lastFocusedSessionId.current = selectedId;
      return;
    }

    if (selectedId === lastFocusedSessionId.current) {
      return;
    }

    const sessionId = selectedId.replace(/^session-/, "");
    const session = sessions.find((entry) => entry.id === sessionId);
    if (!session) {
      return;
    }

    trackMcpSessionFocus(session.status, !!session.workspace_path);
    lastFocusedSessionId.current = selectedId;
  }, [selectedId, sessions]);

  useEffect(() => {
    const nextStatusBySession = statusBySession.current;
    const activeSessionIds = new Set(sessions.map((session) => session.id));

    sessions.forEach((session) => {
      const previousStatus = nextStatusBySession.get(session.id);
      if (previousStatus && previousStatus !== session.status) {
        trackMcpSessionStatusChange(previousStatus, session.status);
      }
      nextStatusBySession.set(session.id, session.status);
    });

    Array.from(nextStatusBySession.keys()).forEach((sessionId) => {
      if (!activeSessionIds.has(sessionId)) {
        nextStatusBySession.delete(sessionId);
      }
    });
  }, [sessions]);
};
