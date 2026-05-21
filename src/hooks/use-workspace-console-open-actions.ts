import { useCallback, useRef } from "react";
import { useAppToast } from "@/hooks/use-app-toast";
import {
  findWorkspaceConsoleSessionForWorkspace,
  runWorkspaceConsoleOpenRequest,
} from "@/lib/workspace-console";
import {
  createWorkspaceConsoleSession,
} from "@/services/workspace-console";
import {
  trackWorkspaceConsoleOpened,
  trackWorkspaceConsoleSessionCreateFailed,
  trackWorkspaceConsoleSessionCreated,
} from "@/services/workspace-console-analytics";
import type {
  OpenWorkspaceConsoleInput,
} from "@/components/WorkspaceConsole/WorkspaceConsoleContext";
import type { WorkspaceConsoleSource } from "@/lib/workspace-console-analytics";
import type { WorkspaceConsoleSession } from "@/types/workspace-console";

interface WorkspaceConsoleOpenActionsInput {
  activeWorkspace: OpenWorkspaceConsoleInput | null;
  openDock: () => void;
  sessions: WorkspaceConsoleSession[];
  setActiveSessionId: (sessionId: string) => void;
  setLastWorkspace: (workspace: OpenWorkspaceConsoleInput) => void;
}

export const useWorkspaceConsoleOpenActions = ({
  activeWorkspace,
  openDock,
  sessions,
  setActiveSessionId,
  setLastWorkspace,
}: WorkspaceConsoleOpenActionsInput) => {
  const toast = useAppToast();
  const pendingWorkspaceOpens = useRef(new Map<string, Promise<void>>());

  const createShellForWorkspace = useCallback(
    async (
      workspace: OpenWorkspaceConsoleInput | null,
      source: WorkspaceConsoleSource = "new-shell",
    ) => {
      if (!workspace) return;
      openDock();
      setLastWorkspace(workspace);
      const result = await createWorkspaceConsoleSession(workspace);
      if (!result.success || !result.session) {
        trackWorkspaceConsoleSessionCreateFailed({
          error: result.error,
          source,
          targetKind: workspace.targetKind,
        });
        toast.error({
          title: "Terminal could not start",
          description: result.error ?? "Unknown terminal error.",
        });
        return;
      }
      trackWorkspaceConsoleSessionCreated({
        source,
        targetKind: workspace.targetKind,
        sessionCount: sessions.length + 1,
      });
      setActiveSessionId(result.session.sessionId);
    },
    [openDock, sessions.length, setActiveSessionId, setLastWorkspace, toast],
  );

  const openConsoleForWorkspace = useCallback(
    async (workspace: OpenWorkspaceConsoleInput) => {
      openDock();
      setLastWorkspace(workspace);
      const existingSession = findWorkspaceConsoleSessionForWorkspace(
        sessions,
        workspace.workspacePath,
      );
      trackWorkspaceConsoleOpened({
        reusedExistingSession: Boolean(existingSession),
        sessionCount: sessions.length,
        source: "workspace-card",
        targetKind: workspace.targetKind,
      });
      if (existingSession) {
        setActiveSessionId(existingSession.sessionId);
        return;
      }
      await runWorkspaceConsoleOpenRequest({
        createSession: () => createShellForWorkspace(workspace, "workspace-card"),
        pendingOpens: pendingWorkspaceOpens.current,
        workspacePath: workspace.workspacePath,
      });
    },
    [createShellForWorkspace, openDock, sessions, setActiveSessionId, setLastWorkspace],
  );

  return {
    createShell: () => createShellForWorkspace(activeWorkspace),
    openConsoleForWorkspace,
  };
};
