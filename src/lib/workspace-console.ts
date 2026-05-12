import type { WorkspaceConsoleSession } from "@/types/workspace-console";

export type WorkspaceConsolePresentation = "none" | "restore" | "dock" | "expanded";

interface WorkspaceConsolePresentationInput {
  isExpanded: boolean;
  isOpen: boolean;
  routeVisible: boolean;
  sessionCount: number;
}

export const shouldConfirmWorkspaceConsoleClose = (
  session: Pick<WorkspaceConsoleSession, "status">,
): boolean => session.status === "running" || session.status === "starting";

export const findWorkspaceConsoleSessionForWorkspace = (
  sessions: WorkspaceConsoleSession[],
  workspacePath: string,
): WorkspaceConsoleSession | null =>
  sessions.find((session) => session.workspacePath === workspacePath) ?? null;

export const getWorkspaceConsolePresentation = ({
  isExpanded,
  isOpen,
  routeVisible,
  sessionCount,
}: WorkspaceConsolePresentationInput): WorkspaceConsolePresentation => {
  if (!routeVisible || sessionCount === 0) return "none";
  if (!isOpen) return "restore";
  if (isExpanded) return "expanded";
  return "dock";
};

export const shouldShowWorkspaceConsoleRestoreBar = ({
  isOpen,
  routeVisible,
  sessionCount,
}: {
  isOpen: boolean;
  routeVisible: boolean;
  sessionCount: number;
}): boolean =>
  getWorkspaceConsolePresentation({
    isExpanded: false,
    isOpen,
    routeVisible,
    sessionCount,
  }) === "restore";

export const shouldShowWorkspaceConsoleDock = ({
  isExpanded = false,
  isOpen,
  routeVisible,
  sessionCount,
}: {
  isExpanded?: boolean;
  isOpen: boolean;
  routeVisible: boolean;
  sessionCount: number;
}): boolean => {
  const presentation = getWorkspaceConsolePresentation({
    isExpanded,
    isOpen,
    routeVisible,
    sessionCount,
  });
  return presentation === "dock" || presentation === "expanded";
};
