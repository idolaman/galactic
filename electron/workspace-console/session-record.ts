import { randomUUID } from "node:crypto";
import process from "node:process";
import {
  getWorkspaceConsoleShellArgs,
  resolveWorkspaceConsoleShell,
} from "./shell.js";
import { getWorkspaceConsoleLabel } from "./workspace-paths.js";
import {
  createWorkspaceConsoleSummary,
  toWorkspaceConsoleErrorMessage,
} from "./session-lifecycle.js";
import type {
  WorkspaceConsolePty,
  WorkspaceConsolePtyAdapter,
} from "./pty-adapter.js";
import type {
  CreateWorkspaceConsoleSessionInput,
  WorkspaceConsoleResult,
  WorkspaceConsoleSessionSummary,
} from "./types.js";

export interface WorkspaceConsoleSessionRecord {
  disposables: Array<{ dispose: () => void }>;
  pty: WorkspaceConsolePty;
  summary: WorkspaceConsoleSessionSummary;
}

interface CreateRecordOptions {
  adapter: WorkspaceConsolePtyAdapter;
  cwd: string;
  input: CreateWorkspaceConsoleSessionInput;
}

interface AttachRecordEventsOptions {
  onData: (data: string) => void;
  onError: (error: Error) => void;
  onExit: (event: { exitCode: number; signal?: number }) => void;
}

export const createWorkspaceConsoleSessionRecord = ({
  adapter,
  cwd,
  input,
}: CreateRecordOptions): WorkspaceConsoleResult<WorkspaceConsoleSessionRecord> => {
  const shell = resolveWorkspaceConsoleShell();
  const workspaceLabel = getWorkspaceConsoleLabel(
    input.workspacePath,
    input.workspaceLabel,
  );
  const projectName = input.projectName?.trim() || undefined;
  let pty: WorkspaceConsolePty;
  try {
    pty = adapter.spawn({
      cols: input.cols ?? 80,
      cwd,
      env: { ...process.env },
      rows: input.rows ?? 24,
      shell,
      shellArgs: getWorkspaceConsoleShellArgs(),
    });
  } catch (error) {
    return {
      success: false,
      error: toWorkspaceConsoleErrorMessage(error),
    };
  }

  return {
    success: true,
    value: {
      disposables: [],
      pty,
      summary: createWorkspaceConsoleSummary(
        randomUUID(),
        input.workspacePath,
        workspaceLabel,
        projectName,
        cwd,
      ),
    },
  };
};

export const attachWorkspaceConsoleRecordEvents = (
  record: WorkspaceConsoleSessionRecord,
  options: AttachRecordEventsOptions,
): void => {
  record.disposables.push(record.pty.onData(options.onData));
  record.disposables.push(record.pty.onExit(options.onExit));
  const errorDisposable = record.pty.onError?.(options.onError);
  if (errorDisposable) record.disposables.push(errorDisposable);
};
