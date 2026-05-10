import type {
  WorkspaceConsoleSessionSummary,
  WorkspaceConsoleStatus,
} from "./types.js";

const titlePattern = /\x1b\](?:0|2);([^\x07\x1b]*)(?:\x07|\x1b\\)/g;

export const createWorkspaceConsoleSummary = (
  sessionId: string,
  workspacePath: string,
  label: string,
  cwd: string,
): WorkspaceConsoleSessionSummary => ({
  sessionId,
  workspacePath,
  workspaceLabel: label,
  cwd,
  status: "starting",
  title: label,
  createdAt: Date.now(),
});

export const extractWorkspaceConsoleTitles = (data: string): string[] =>
  Array.from(data.matchAll(titlePattern), (match) => match[1]).filter(Boolean);

export const isLiveWorkspaceConsoleStatus = (
  status: WorkspaceConsoleStatus,
): boolean => status === "running" || status === "starting";

export const toWorkspaceConsoleErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : "Terminal error.";
