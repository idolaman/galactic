import { resolveWorkspaceConsoleCwd } from "./workspace-paths.js";
import { isLiveWorkspaceConsoleStatus, toWorkspaceConsoleErrorMessage } from "./session-lifecycle.js";
import {
  nodePtyWorkspaceConsoleAdapter,
  type WorkspaceConsolePtyAdapter,
} from "./pty-adapter.js";
import {
  attachWorkspaceConsoleSessionEvents,
  markWorkspaceConsoleRecordError,
} from "./session-events.js";
import { createWorkspaceConsoleSessionRecord, type WorkspaceConsoleSessionRecord } from "./session-record.js";
import type {
  CreateWorkspaceConsoleSessionInput,
  WorkspaceConsoleEvent,
  WorkspaceConsoleResult,
  WorkspaceConsoleSessionSummary,
} from "./types.js";

export class WorkspaceConsoleSessionManager {
  private readonly adapter: WorkspaceConsolePtyAdapter;
  private readonly listeners = new Set<(event: WorkspaceConsoleEvent) => void>();
  private readonly sessions = new Map<string, WorkspaceConsoleSessionRecord>();

  constructor(adapter = nodePtyWorkspaceConsoleAdapter) {
    this.adapter = adapter;
  }

  onEvent(listener: (event: WorkspaceConsoleEvent) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  listSessions(): WorkspaceConsoleSessionSummary[] {
    return Array.from(this.sessions.values()).map((record) => ({ ...record.summary }));
  }

  createSession(input: CreateWorkspaceConsoleSessionInput): WorkspaceConsoleResult<WorkspaceConsoleSessionSummary> {
    const cwdResult = resolveWorkspaceConsoleCwd(input.workspacePath, input.cwd);
    if (!cwdResult.success) {
      return { success: false, error: cwdResult.error };
    }

    try {
      const recordResult = createWorkspaceConsoleSessionRecord({
        adapter: this.adapter,
        cwd: cwdResult.cwd,
        input,
      });
      if (!recordResult.success || !recordResult.value) {
        return { success: false, error: recordResult.error ?? "Failed to start terminal." };
      }

      const record = recordResult.value;
      const { sessionId } = record.summary;
      this.sessions.set(sessionId, record);
      attachWorkspaceConsoleSessionEvents(record, (event) => this.emit(event));
      record.summary.status = "running";
      this.emit({ type: "created", session: { ...record.summary } });
      return { success: true, value: { ...record.summary } };
    } catch (error) {
      return {
        success: false,
        error: toWorkspaceConsoleErrorMessage(error),
      };
    }
  }

  writeInput(sessionId: string, data: string): WorkspaceConsoleResult {
    const record = this.sessions.get(sessionId);
    if (!record) return { success: false, error: "Terminal session not found." };

    try {
      record.pty.write(data);
      return { success: true };
    } catch (error) {
      this.markError(record, error);
      return { success: false, error: "Failed to write to terminal." };
    }
  }

  resize(sessionId: string, cols: number, rows: number): WorkspaceConsoleResult {
    const record = this.sessions.get(sessionId);
    if (!record) return { success: false, error: "Terminal session not found." };

    try {
      record.pty.resize(cols, rows);
      return { success: true };
    } catch (error) {
      this.markError(record, error);
      return { success: false, error: "Failed to resize terminal." };
    }
  }

  killSession(sessionId: string): WorkspaceConsoleResult {
    const record = this.sessions.get(sessionId);
    if (!record) return { success: false, error: "Terminal session not found." };

    if (isLiveWorkspaceConsoleStatus(record.summary.status)) {
      try {
        record.pty.kill();
      } catch (error) {
        this.markError(record, error);
        return { success: false, error: "Failed to close terminal." };
      }
    }
    this.removeRecord(sessionId);
    return { success: true };
  }

  disposeAll(): void {
    Array.from(this.sessions.keys()).forEach((sessionId) => {
      const record = this.sessions.get(sessionId);
      if (record && isLiveWorkspaceConsoleStatus(record.summary.status)) {
        try {
          record.pty.kill();
        } catch {
          this.markError(record, new Error("Failed to close terminal."));
        }
      }
      this.removeRecord(sessionId);
    });
  }

  private markError(record: WorkspaceConsoleSessionRecord, error: unknown): void {
    markWorkspaceConsoleRecordError(record, error, (event) => this.emit(event));
  }

  private removeRecord(sessionId: string): void {
    const record = this.sessions.get(sessionId);
    if (!record) return;
    record.disposables.forEach((disposable) => disposable.dispose());
    this.sessions.delete(sessionId);
    this.emit({ type: "removed", sessionId });
  }

  private emit(event: WorkspaceConsoleEvent): void {
    this.listeners.forEach((listener) => listener(event));
  }
}
