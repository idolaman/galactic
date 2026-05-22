import { extractWorkspaceConsoleTitles, toWorkspaceConsoleErrorMessage } from "./session-lifecycle.js";
import { attachWorkspaceConsoleRecordEvents, type WorkspaceConsoleSessionRecord } from "./session-record.js";
import type { WorkspaceConsoleEvent } from "./types.js";

type EmitWorkspaceConsoleEvent = (event: WorkspaceConsoleEvent) => void;

export const markWorkspaceConsoleRecordError = (
  record: WorkspaceConsoleSessionRecord,
  error: unknown,
  emit: EmitWorkspaceConsoleEvent,
): void => {
  record.summary.status = "error";
  emit({
    type: "error",
    sessionId: record.summary.sessionId,
    error: toWorkspaceConsoleErrorMessage(error),
  });
};

export const attachWorkspaceConsoleSessionEvents = (
  record: WorkspaceConsoleSessionRecord,
  emit: EmitWorkspaceConsoleEvent,
): void => {
  attachWorkspaceConsoleRecordEvents(record, {
    onData: (data) => {
      emit({ type: "data", sessionId: record.summary.sessionId, data });
      for (const title of extractWorkspaceConsoleTitles(data)) {
        record.summary.title = title || record.summary.workspaceLabel;
        emit({ type: "title", sessionId: record.summary.sessionId, title: record.summary.title });
      }
    },
    onError: (error) => markWorkspaceConsoleRecordError(record, error, emit),
    onExit: (event) => {
      record.summary = {
        ...record.summary,
        exitCode: event.exitCode,
        signal: event.signal,
        status: "exited",
      };
      emit({
        type: "exit",
        sessionId: record.summary.sessionId,
        exitCode: event.exitCode,
        signal: event.signal,
      });
    },
  });
};
