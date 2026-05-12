import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useAppToast } from "@/hooks/use-app-toast";
import { useWorkspaceConsoleSessionState } from "@/hooks/use-workspace-console-session-state";
import {
  findWorkspaceConsoleSessionForWorkspace,
  runWorkspaceConsoleOpenRequest,
} from "@/lib/workspace-console";
import {
  createWorkspaceConsoleSession,
  killWorkspaceConsoleSession,
} from "@/services/workspace-console";
import {
  WorkspaceConsoleContext,
  type OpenWorkspaceConsoleInput,
} from "@/components/WorkspaceConsole/WorkspaceConsoleContext";

interface WorkspaceConsoleProviderProps {
  children: ReactNode;
}

export const WorkspaceConsoleProvider = ({
  children,
}: WorkspaceConsoleProviderProps) => {
  const toast = useAppToast();
  const { activeSession, sessions, setActiveSessionId } =
    useWorkspaceConsoleSessionState();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [lastWorkspace, setLastWorkspace] =
    useState<OpenWorkspaceConsoleInput | null>(null);
  const pendingWorkspaceOpens = useRef(new Map<string, Promise<void>>());

  const activeWorkspace = useMemo<OpenWorkspaceConsoleInput | null>(() => {
    if (activeSession) {
      return {
        workspaceLabel: activeSession.workspaceLabel,
        workspacePath: activeSession.workspacePath,
      };
    }
    return lastWorkspace;
  }, [activeSession, lastWorkspace]);

  const createShellForWorkspace = useCallback(
    async (workspace: OpenWorkspaceConsoleInput | null) => {
      if (!workspace) return;
      setIsOpen(true);
      setLastWorkspace(workspace);
      const result = await createWorkspaceConsoleSession(workspace);
      if (!result.success || !result.session) {
        toast.error({
          title: "Terminal could not start",
          description: result.error ?? "Unknown terminal error.",
        });
        return;
      }
      setActiveSessionId(result.session.sessionId);
    },
    [setActiveSessionId, toast],
  );

  const openConsoleForWorkspace = useCallback(
    async (workspace: OpenWorkspaceConsoleInput) => {
      setIsOpen(true);
      setLastWorkspace(workspace);
      const existingSession = findWorkspaceConsoleSessionForWorkspace(
        sessions,
        workspace.workspacePath,
      );
      if (existingSession) {
        setActiveSessionId(existingSession.sessionId);
        return;
      }
      await runWorkspaceConsoleOpenRequest({
        createSession: () => createShellForWorkspace(workspace),
        pendingOpens: pendingWorkspaceOpens.current,
        workspacePath: workspace.workspacePath,
      });
    },
    [createShellForWorkspace, sessions, setActiveSessionId],
  );

  const closeSession = useCallback(
    async (sessionId: string) => {
      const result = await killWorkspaceConsoleSession(sessionId);
      if (!result.success) {
        toast.error({
          title: "Terminal could not close",
          description: result.error ?? "Unknown terminal error.",
        });
      }
    },
    [toast],
  );

  useEffect(() => {
    if (sessions.length === 0) {
      setIsExpanded(false);
      setIsOpen(false);
    }
  }, [sessions.length]);

  const value = {
    activeSession,
    canCreateShell: Boolean(activeWorkspace),
    closeSession,
    collapseConsole: () => setIsExpanded(false),
    createShell: () => createShellForWorkspace(activeWorkspace),
    expandConsole: () => setIsExpanded(true),
    focusSession: setActiveSessionId,
    hideDock: () => setIsOpen(false),
    isExpanded,
    isOpen,
    openConsoleForWorkspace,
    showDock: () => setIsOpen(true),
    sessions,
  };

  return (
    <WorkspaceConsoleContext.Provider value={value}>
      {children}
    </WorkspaceConsoleContext.Provider>
  );
};
