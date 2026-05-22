import {
  getWorkspaceConsoleErrorKind,
  getWorkspaceConsoleExitCodeBucket,
  normalizeWorkspaceConsoleStatus,
  normalizeWorkspaceConsoleTargetKind,
  type WorkspaceConsoleSize,
  type WorkspaceConsoleSource,
  type WorkspaceConsoleTargetKind,
  type WorkspaceConsoleTrackedStatus,
} from "../lib/workspace-console-analytics.js";
import type { WorkspaceConsoleStatus } from "../types/workspace-console.js";
import { trackAnalyticsEvent } from "./analytics.js";

interface WorkspaceConsoleSourceInput {
  source: WorkspaceConsoleSource;
  targetKind?: WorkspaceConsoleTargetKind | string;
}

interface WorkspaceConsoleSessionInput {
  sessionCount?: number;
  status?: WorkspaceConsoleStatus;
}

const targetPayload = (targetKind?: string) => ({
  targetKind: normalizeWorkspaceConsoleTargetKind(targetKind),
});

const statusPayload = (status?: WorkspaceConsoleStatus): {
  status: WorkspaceConsoleTrackedStatus;
} => ({
  status: normalizeWorkspaceConsoleStatus(status),
});

export const trackWorkspaceConsoleOpened = (
  input: WorkspaceConsoleSourceInput &
    WorkspaceConsoleSessionInput & { reusedExistingSession: boolean },
): void => {
  trackAnalyticsEvent("WorkspaceConsole.opened", {
    source: input.source,
    ...targetPayload(input.targetKind),
    reusedExistingSession: input.reusedExistingSession,
    sessionCount: input.sessionCount,
  });
};

export const trackWorkspaceConsoleSessionCreated = (
  input: WorkspaceConsoleSourceInput & WorkspaceConsoleSessionInput,
): void => {
  trackAnalyticsEvent("WorkspaceConsole.sessionCreated", {
    source: input.source,
    ...targetPayload(input.targetKind),
    sessionCount: input.sessionCount,
  });
};

export const trackWorkspaceConsoleSessionCreateFailed = (
  input: WorkspaceConsoleSourceInput & { error?: string },
): void => {
  trackAnalyticsEvent("WorkspaceConsole.sessionCreateFailed", {
    source: input.source,
    ...targetPayload(input.targetKind),
    errorKind: getWorkspaceConsoleErrorKind(input.error),
  });
};

export const trackWorkspaceConsoleHidden = (
  input: WorkspaceConsoleSessionInput,
): void => {
  trackAnalyticsEvent("WorkspaceConsole.hidden", {
    ...statusPayload(input.status),
    sessionCount: input.sessionCount,
  });
};

export const trackWorkspaceConsoleRestored = (sessionCount: number): void => {
  trackAnalyticsEvent("WorkspaceConsole.restored", {
    source: "restore-bar",
    sessionCount,
  });
};

export const trackWorkspaceConsoleSizeChanged = (
  size: WorkspaceConsoleSize,
  sessionCount: number,
): void => {
  trackAnalyticsEvent("WorkspaceConsole.sizeChanged", { size, sessionCount });
};

export const trackWorkspaceConsoleTabFocused = (
  input: WorkspaceConsoleSessionInput,
): void => {
  trackAnalyticsEvent("WorkspaceConsole.tabFocused", {
    ...statusPayload(input.status),
    sessionCount: input.sessionCount,
  });
};

export const trackWorkspaceConsoleSessionClosed = (
  input: WorkspaceConsoleSessionInput & { confirmRequired: boolean },
): void => {
  trackAnalyticsEvent("WorkspaceConsole.sessionClosed", {
    ...statusPayload(input.status),
    confirmRequired: input.confirmRequired,
    sessionCount: input.sessionCount,
  });
};

export const trackWorkspaceConsoleSessionCloseFailed = (
  input: WorkspaceConsoleSessionInput & { confirmRequired: boolean; error?: string },
): void => {
  trackAnalyticsEvent("WorkspaceConsole.sessionCloseFailed", {
    ...statusPayload(input.status),
    confirmRequired: input.confirmRequired,
    errorKind: getWorkspaceConsoleErrorKind(input.error),
  });
};

export const trackWorkspaceConsoleSessionExited = (
  exitCode?: number,
  signal?: number,
): void => {
  trackAnalyticsEvent("WorkspaceConsole.sessionExited", {
    exitCodeBucket: getWorkspaceConsoleExitCodeBucket(exitCode),
    hadSignal: typeof signal === "number",
  });
};

export const trackWorkspaceConsoleSessionErrored = (error?: string): void => {
  trackAnalyticsEvent("WorkspaceConsole.sessionErrored", {
    errorKind: getWorkspaceConsoleErrorKind(error),
  });
};
