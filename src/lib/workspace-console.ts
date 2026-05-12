import type { WorkspaceConsoleSession } from "@/types/workspace-console";

export const shouldConfirmWorkspaceConsoleClose = (
  session: Pick<WorkspaceConsoleSession, "status">,
): boolean => session.status === "running" || session.status === "starting";

export const findWorkspaceConsoleSessionForWorkspace = (
  sessions: WorkspaceConsoleSession[],
  workspacePath: string,
): WorkspaceConsoleSession | null =>
  sessions.find((session) => session.workspacePath === workspacePath) ?? null;

export const shouldShowWorkspaceConsoleRestoreBar = ({
  isOpen,
  routeVisible,
  sessionCount,
}: {
  isOpen: boolean;
  routeVisible: boolean;
  sessionCount: number;
}): boolean => routeVisible && !isOpen && sessionCount > 0;
