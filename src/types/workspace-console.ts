export type WorkspaceConsoleStatus = "starting" | "running" | "exited" | "error";

export interface WorkspaceConsoleSession {
  sessionId: string;
  workspacePath: string;
  workspaceLabel: string;
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
  cwd?: string;
  cols?: number;
  rows?: number;
}

export interface WorkspaceConsoleActionResult {
  success: boolean;
  error?: string;
}

export interface CreateWorkspaceConsoleSessionResult extends WorkspaceConsoleActionResult {
  session?: WorkspaceConsoleSession;
}

export type WorkspaceConsoleEvent =
  | { type: "created"; session: WorkspaceConsoleSession }
  | { type: "data"; sessionId: string; data: string }
  | { type: "title"; sessionId: string; title: string }
  | { type: "exit"; sessionId: string; exitCode: number; signal?: number }
  | { type: "error"; sessionId: string; error: string }
  | { type: "removed"; sessionId: string };
