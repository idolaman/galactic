export type WorkspaceConsoleStatus = "starting" | "running" | "exited" | "error";

export interface WorkspaceConsoleSessionSummary {
  sessionId: string;
  workspacePath: string;
  workspaceLabel: string;
  projectName?: string;
  cwd: string;
  status: WorkspaceConsoleStatus;
  title: string;
  createdAt: number;
  exitCode?: number;
  signal?: number;
}

export interface CreateWorkspaceConsoleSessionInput {
  workspacePath: string;
  workspaceLabel?: string;
  projectName?: string;
  cwd?: string;
  cols?: number;
  rows?: number;
}

export type WorkspaceConsoleEvent =
  | { type: "created"; session: WorkspaceConsoleSessionSummary }
  | { type: "data"; sessionId: string; data: string }
  | { type: "title"; sessionId: string; title: string }
  | { type: "exit"; sessionId: string; exitCode: number; signal?: number }
  | { type: "error"; sessionId: string; error: string }
  | { type: "removed"; sessionId: string };

export interface WorkspaceConsoleResult<T = undefined> {
  success: boolean;
  error?: string;
  value?: T;
}
