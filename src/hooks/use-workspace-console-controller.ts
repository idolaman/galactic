import { useCallback, useMemo, useState } from "react";
import { useWorkspaceConsoleSessionState } from "@/hooks/use-workspace-console-session-state";
import { useAppToast } from "@/hooks/use-app-toast";
import { useWorkspaceConsoleLifecycleAnalytics } from "@/hooks/use-workspace-console-lifecycle-analytics";
import { useWorkspaceConsoleOpenActions } from "@/hooks/use-workspace-console-open-actions";
import { useWorkspaceConsoleVisibility } from "@/hooks/use-workspace-console-visibility";
import {
  trackWorkspaceConsoleSessionCloseFailed,
  trackWorkspaceConsoleSessionClosed,
  trackWorkspaceConsoleTabFocused,
} from "@/services/workspace-console-analytics";
import { killWorkspaceConsoleSession } from "@/services/workspace-console";
import type {
  OpenWorkspaceConsoleInput,
  WorkspaceConsoleContextValue,
} from "@/components/WorkspaceConsole/WorkspaceConsoleContext";

const getActiveWorkspace = (
  activeSession: WorkspaceConsoleContextValue["activeSession"],
  lastWorkspace: OpenWorkspaceConsoleInput | null,
): OpenWorkspaceConsoleInput | null => {
  if (!activeSession) return lastWorkspace;
  const matchingLastWorkspace =
    lastWorkspace?.workspacePath === activeSession.workspacePath ? lastWorkspace : null;
  return {
    projectName: activeSession.projectName ?? matchingLastWorkspace?.projectName,
    targetKind: matchingLastWorkspace?.targetKind,
    workspaceLabel: activeSession.workspaceLabel,
    workspacePath: activeSession.workspacePath,
  };
};

export const useWorkspaceConsoleController = (): WorkspaceConsoleContextValue => {
  const toast = useAppToast();
  const { activeSession, sessions, setActiveSessionId } =
    useWorkspaceConsoleSessionState();
  const [lastWorkspace, setLastWorkspace] =
    useState<OpenWorkspaceConsoleInput | null>(null);
  useWorkspaceConsoleLifecycleAnalytics();
  const visibility = useWorkspaceConsoleVisibility({
    activeStatus: activeSession?.status,
    sessionCount: sessions.length,
  });

  const activeWorkspace = useMemo<OpenWorkspaceConsoleInput | null>(() => {
    return getActiveWorkspace(activeSession, lastWorkspace);
  }, [activeSession, lastWorkspace]);
  const { createShell, openConsoleForWorkspace } = useWorkspaceConsoleOpenActions({
    activeWorkspace,
    openDock: visibility.openDock,
    sessions,
    setActiveSessionId,
    setLastWorkspace,
  });

  const closeSession = useCallback(
    async (sessionId: string) => {
      const session = sessions.find((item) => item.sessionId === sessionId);
      const confirmRequired = false;
      const result = await killWorkspaceConsoleSession(sessionId);
      if (!result.success) {
        trackWorkspaceConsoleSessionCloseFailed({
          confirmRequired,
          error: result.error,
          status: session?.status,
        });
        toast.error({
          title: "Terminal could not close",
          description: result.error ?? "Unknown terminal error.",
        });
        return;
      }
      trackWorkspaceConsoleSessionClosed({
        confirmRequired,
        sessionCount: sessions.length,
        status: session?.status,
      });
    },
    [sessions, toast],
  );

  const focusSession = useCallback(
    (sessionId: string) => {
      const session = sessions.find((item) => item.sessionId === sessionId);
      if (session && session.sessionId !== activeSession?.sessionId) {
        trackWorkspaceConsoleTabFocused({
          sessionCount: sessions.length,
          status: session.status,
        });
      }
      setActiveSessionId(sessionId);
    },
    [activeSession?.sessionId, sessions, setActiveSessionId],
  );

  return {
    activeSession,
    canCreateShell: Boolean(activeWorkspace),
    closeSession,
    collapseConsole: visibility.collapseConsole,
    createShell,
    expandConsole: visibility.expandConsole,
    focusSession,
    hideDock: visibility.hideDock,
    isExpanded: visibility.isExpanded,
    isOpen: visibility.isOpen,
    openConsoleForWorkspace,
    showDock: visibility.showDock,
    sessions,
  };
};
