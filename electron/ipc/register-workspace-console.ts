import type { IpcMain } from "electron";
import type { WorkspaceConsoleSessionManager } from "../workspace-console/manager.js";
import type { CreateWorkspaceConsoleSessionInput } from "../workspace-console/types.js";

interface WorkspaceConsoleIpcDeps {
  ipcMain: Pick<IpcMain, "handle">;
  sessionManager: Pick<
    WorkspaceConsoleSessionManager,
    "createSession" | "killSession" | "listSessions" | "resize" | "writeInput"
  >;
}

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const isPositiveInteger = (value: unknown): value is number =>
  typeof value === "number" && Number.isInteger(value) && value > 0;

const parseCreateInput = (
  value: unknown,
): { success: true; input: CreateWorkspaceConsoleSessionInput } | { success: false; error: string } => {
  if (!value || typeof value !== "object") {
    return { success: false, error: "Workspace terminal input is required." };
  }

  const input = value as Record<string, unknown>;
  if (!isNonEmptyString(input.workspacePath)) {
    return { success: false, error: "Workspace path is required." };
  }
  if (input.cwd !== undefined && typeof input.cwd !== "string") {
    return { success: false, error: "Terminal cwd is invalid." };
  }
  if (
    (input.cols !== undefined && !isPositiveInteger(input.cols)) ||
    (input.rows !== undefined && !isPositiveInteger(input.rows))
  ) {
    return { success: false, error: "Terminal size is invalid." };
  }

  return {
    success: true,
    input: {
      workspacePath: input.workspacePath,
      ...(typeof input.workspaceLabel === "string" ? { workspaceLabel: input.workspaceLabel } : {}),
      ...(typeof input.cwd === "string" ? { cwd: input.cwd } : {}),
      ...(isPositiveInteger(input.cols) ? { cols: input.cols } : {}),
      ...(isPositiveInteger(input.rows) ? { rows: input.rows } : {}),
    },
  };
};

export const registerWorkspaceConsoleIpc = ({
  ipcMain,
  sessionManager,
}: WorkspaceConsoleIpcDeps): void => {
  ipcMain.handle("workspace-console/create-session", async (_event, input: unknown) => {
    const parsedInput = parseCreateInput(input);
    if (!parsedInput.success) return parsedInput;

    const result = sessionManager.createSession(parsedInput.input);
    return result.success
      ? { success: true, session: result.value }
      : { success: false, error: result.error };
  });

  ipcMain.handle("workspace-console/list-sessions", () => sessionManager.listSessions());

  ipcMain.handle("workspace-console/write-input", (_event, sessionId: unknown, data: unknown) => {
    if (!isNonEmptyString(sessionId) || typeof data !== "string") {
      return { success: false, error: "Terminal input is invalid." };
    }
    return sessionManager.writeInput(sessionId, data);
  });

  ipcMain.handle("workspace-console/resize", (_event, sessionId: unknown, cols: unknown, rows: unknown) => {
    if (!isNonEmptyString(sessionId) || !isPositiveInteger(cols) || !isPositiveInteger(rows)) {
      return { success: false, error: "Terminal size is invalid." };
    }
    return sessionManager.resize(sessionId, cols, rows);
  });

  ipcMain.handle("workspace-console/kill-session", (_event, sessionId: unknown) => {
    if (!isNonEmptyString(sessionId)) {
      return { success: false, error: "Terminal session id is required." };
    }
    return sessionManager.killSession(sessionId);
  });
};
