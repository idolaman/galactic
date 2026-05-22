import type { WorkspaceConsoleSession } from "@/types/workspace-console";

export type WorkspaceConsolePresentation = "none" | "restore" | "dock" | "expanded";

export interface WorkspaceConsoleTerminalSize {
  cols: number;
  rows: number;
}

interface WorkspaceConsolePresentationInput {
  isExpanded: boolean;
  isOpen: boolean;
  routeVisible: boolean;
  sessionCount: number;
}

interface WorkspaceConsoleOpenRequestOptions {
  createSession: () => Promise<void>;
  pendingOpens: Map<string, Promise<void>>;
  workspacePath: string;
}

const statusLabels: Record<WorkspaceConsoleSession["status"], string> = {
  error: "Error",
  exited: "Exited",
  running: "Running",
  starting: "Starting",
};

export const getWorkspaceConsoleTabLabel = (
  session: Pick<WorkspaceConsoleSession, "projectName" | "title" | "workspaceLabel">,
): string => {
  const workspaceLabel = session.workspaceLabel.trim() || session.title;
  const projectName = session.projectName?.trim();
  return projectName ? `${workspaceLabel} / ${projectName}` : workspaceLabel;
};

export const getWorkspaceConsoleSessionCountLabel = (count: number): string =>
  count === 1 ? "1 session" : `${count} sessions`;

export const getWorkspaceConsoleStatusLabel = (
  status: WorkspaceConsoleSession["status"],
): string => statusLabels[status];

export const shouldResizeWorkspaceConsoleTerminal = (
  previous: WorkspaceConsoleTerminalSize | null,
  next: WorkspaceConsoleTerminalSize,
): boolean =>
  next.cols > 0 &&
  next.rows > 0 &&
  (!previous || previous.cols !== next.cols || previous.rows !== next.rows);

export const findWorkspaceConsoleSessionForWorkspace = (
  sessions: WorkspaceConsoleSession[],
  workspacePath: string,
): WorkspaceConsoleSession | null =>
  sessions.find((session) => session.workspacePath === workspacePath) ?? null;

export const runWorkspaceConsoleOpenRequest = async ({
  createSession,
  pendingOpens,
  workspacePath,
}: WorkspaceConsoleOpenRequestOptions): Promise<void> => {
  const pendingOpen = pendingOpens.get(workspacePath);
  if (pendingOpen) {
    await pendingOpen;
    return;
  }

  const nextOpen = createSession();
  pendingOpens.set(workspacePath, nextOpen);
  try {
    await nextOpen;
  } finally {
    pendingOpens.delete(workspacePath);
  }
};

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
